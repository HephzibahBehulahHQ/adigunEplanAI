[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Archive,
    [Parameter(Mandatory)][string]$Output,
    [string]$EtimClass
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivePath = (Resolve-Path -LiteralPath $Archive).ProviderPath
$outputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
if ([string]::Equals($archivePath, $outputPath, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The output must differ from the source archive.'
}

$sourceHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
$archiveReader = [IO.Compression.ZipFile]::OpenRead($archivePath)
$temporaryPath = "$outputPath.$([guid]::NewGuid()).tmp"
$seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
$written = 0
$withoutDatasheet = 0
try {
    $entries = @($archiveReader.Entries | Where-Object { $_.Name -match '^BMECAT_.+\.xml$' })
    if ($entries.Count -ne 1) { throw 'Expected one WAGO BMEcat XML entry.' }

    $settings = [Xml.XmlReaderSettings]::new()
    $settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
    $settings.XmlResolver = $null
    $stream = $entries[0].Open()
    try {
        $reader = [Xml.XmlReader]::Create($stream, $settings)
        try {
            $writer = [IO.StreamWriter]::new($temporaryPath, $false, [Text.UTF8Encoding]::new($false))
            try {
                $supplierConfirmed = $false
                while ($reader.Read()) {
                    if ($reader.NodeType -eq [Xml.XmlNodeType]::Element -and $reader.LocalName -eq "SUPPLIER_NAME") {
                        $supplierConfirmed = $reader.ReadString() -match "^WAGO\b"
                    }
                    if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.LocalName -ne 'PRODUCT') { continue }
                    if (-not $supplierConfirmed) { throw 'Expected a WAGO supplier header.' }
                    $subtree = $reader.ReadSubtree()
                    try {
                        $product = [Xml.XmlDocument]::new()
                        $product.Load($subtree)
                    } finally { $subtree.Dispose() }

                    $namespace = [Xml.XmlNamespaceManager]::new($product.NameTable)
                    $namespace.AddNamespace('b', 'https://www.etim-international.com/bmecat/50')
                    $details = $product.SelectSingleNode('/b:PRODUCT/b:PRODUCT_DETAILS', $namespace)
                    $code = $details.SelectSingleNode('b:MANUFACTURER_PID', $namespace).InnerText.Trim()
                    if (-not $code -or -not $seen.Add($code)) { throw "Missing or duplicate manufacturer code: $code" }

                    $featureGroups = $product.SelectNodes('/b:PRODUCT/b:PRODUCT_FEATURES', $namespace)
                    if ($EtimClass -and -not ($featureGroups | Where-Object {
                        $_.SelectSingleNode('b:REFERENCE_FEATURE_GROUP_ID', $namespace).InnerText -eq $EtimClass
                    })) { continue }
                    $classifications = @(
                        foreach ($classification in $featureGroups) {
                            $classId = $classification.SelectSingleNode('b:REFERENCE_FEATURE_GROUP_ID', $namespace).InnerText
                            if (-not $classId) { continue }
                            [ordered]@{
                                classId = $classId
                                features = @(
                                    foreach ($feature in $classification.SelectNodes('b:FEATURE', $namespace)) {
                                        [ordered]@{
                                            code = $feature.SelectSingleNode('b:FNAME', $namespace).InnerText
                                            values = @($feature.SelectNodes('b:FVALUE', $namespace) | ForEach-Object InnerText)
                                            unitCode = $feature.SelectSingleNode('b:FUNIT', $namespace).InnerText
                                        }
                                    }
                                )
                            }
                        }
                    )

                    $website = $product.SelectSingleNode("//b:UDX.EDXF.MIME[b:UDX.EDXF.MIME_CODE='MD04']/b:UDX.EDXF.MIME_SOURCE", $namespace).InnerText
                    $datasheet = $product.SelectSingleNode("//b:UDX.EDXF.MIME[b:UDX.EDXF.MIME_CODE='MD22']/b:UDX.EDXF.MIME_SOURCE[@lang='eng']", $namespace).InnerText
                    if (-not $datasheet) { $withoutDatasheet++ }
                    $candidate = [ordered]@{
                        manufacturer = 'WAGO'
                        orderCode = $code
                        description = $details.SelectSingleNode("b:DESCRIPTION_SHORT[@lang='eng']", $namespace).InnerText
                        productUrl = $website
                        datasheetUrl = $datasheet
                        classifications = $classifications
                        catalogEntry = $entries[0].FullName
                        catalogSha256 = $sourceHash
                    }
                    $writer.WriteLine((ConvertTo-Json -InputObject $candidate -Depth 8 -Compress))
                    $written++
                }
                if (-not $seen.Count) { throw 'The archive contains no BMEcat products.' }
            } finally { $writer.Dispose() }
        } finally { $reader.Dispose() }
    } finally { $stream.Dispose() }

    Move-Item -LiteralPath $temporaryPath -Destination $outputPath -Force
} finally {
    $archiveReader.Dispose()
    if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath }
}

[ordered]@{
    sourceCodes = $seen.Count
    candidates = $written
    candidatesWithoutEnglishDatasheet = $withoutDatasheet
    catalogSha256 = $sourceHash
} | ConvertTo-Json -Compress
