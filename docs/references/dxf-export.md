# Native drawing DXF export

The browser exports visible native schematic layers as UTF-8 AutoCAD 2007 (`AC1021`) DXF with `$INSUNITS=4` (millimetres). Native Y-down coordinates become CAD Y-up coordinates by negating Y, without rescaling. Native wires use straight LWPOLYLINE geometry; generic/custom artwork uses LINE/CIRCLE entities; references and annotations use bounded TEXT records. Rotations/mirroring are applied to the actual artwork. The native model remains unchanged.

Layer names retain their names where valid; invalid DXF name characters are replaced and duplicate names gain unique suffixes. Comments preserve the native layer/device/wire identity mapping. Hidden layers are excluded, matching the SVG drawing output. Newlines in annotations become separate text records; control characters cannot inject DXF records. Unicode remains UTF-8. Text uses the consuming CAD application's available font, so final font appearance must be reviewed there.

The format documents drawing geometry. It does not embed ECAD terminal semantics, manufacturer geometry, editable engineering rules, hatches, arbitrary external assets or STEP solids. Native JSON retains the complete project relationships.

Validation uses the independently maintained pinned dxf-parser plus ezdxf 1.4.4 read/audit. Reference output opens with no audit errors or fixes. Unit cases check exact millimetres, wire endpoints, rotated/mirrored lines, circles, hidden layers, Unicode, text bounds and record injection. Browser tests download and parse the actual DXF and confirm unchanged native data. Commercial CAD/printing acceptance remains separate.

Primary format references:

- [Autodesk HEADER variables](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm)
- [Autodesk LWPOLYLINE](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm)
- [Autodesk CIRCLE](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-8663262B-222C-414D-B133-4A8506A27C18.htm)
- [Autodesk TEXT](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-62E5383D-8A14-47B4-BFC4-35824CAE8363.htm)
- [ezdxf document audit](https://ezdxf.readthedocs.io/en/stable/drawing/drawing.html)
