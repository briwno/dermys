Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '../assets/brand/dermys-v1'
$yellow = '#FACC15'
$symbol = New-Object System.Drawing.Drawing2D.GraphicsPath
$symbol.StartFigure()
$symbol.AddLine(0,0,50,0)
$symbol.AddBezier(50,0,116,0,116,100,50,100)
$symbol.AddLine(50,100,6,100)
$symbol.AddBezier(6,100,24,75,57,47,82,24)
$symbol.AddBezier(82,24,52,49,0,69,0,96)
$symbol.AddLine(0,96,0,0)
$symbol.CloseFigure()
$font = New-Object System.Drawing.FontFamily('Arial')
$word = New-Object System.Drawing.Drawing2D.GraphicsPath
$x = 0.0
foreach ($letter in 'DERMYS'.ToCharArray()) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddString([string]$letter,$font,1,100,[System.Drawing.PointF]::new(0,0),[System.Drawing.StringFormat]::GenericTypographic)
  $b=$p.GetBounds(); $m=New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate([single]($x-$b.X),[single](-$b.Y)); $p.Transform($m)
  $word.AddPath($p,$false); $x += $b.Width+17
}
function PathData($p) {
  $pts=$p.PathPoints; $types=$p.PathTypes; $s=''; $i=0
  while($i -lt $pts.Length) {
    $t=$types[$i] -band 7
    $xy=('{0:0.###},{1:0.###}' -f $pts[$i].X,$pts[$i].Y).Replace(', ', ' ')
    if($t -eq 0){$s+='M'+$xy; $i++}
    elseif($t -eq 1){$s+='L'+$xy; if($types[$i] -band 128){$s+='Z'}; $i++}
    else { $s+='C'; for($j=0;$j -lt 3;$j++){$s+=('{0:0.###} {1:0.###} ' -f $pts[$i].X,$pts[$i].Y); $i++}; if($types[$i-1] -band 128){$s+='Z'} }
  }; return $s
}
function Part($path,$scale,$dx,$dy,$color) {
  $p=$path.Clone(); $m=[System.Drawing.Drawing2D.Matrix]::new([single]$scale,0,0,[single]$scale,[single]$dx,[single]$dy); $p.Transform($m)
  return @{path=$p;color=$color}
}
function ExportLogo($name,$w,$h,$parts,$background) {
  $svg="<svg xmlns=`"http://www.w3.org/2000/svg`" width=`"$w`" height=`"$h`" viewBox=`"0 0 $w $h`">"
  $bmp=[System.Drawing.Bitmap]::new($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'
  if($background){$g.Clear([System.Drawing.ColorTranslator]::FromHtml($background)); $svg+="<path fill=`"$background`" d=`"M0 0H${w}V${h}H0Z`"/>"}else{$g.Clear([System.Drawing.Color]::Transparent)}
  foreach($part in $parts){$d=PathData $part.path; $svg+="<path fill=`"$($part.color)`" fill-rule=`"evenodd`" d=`"$d`"/>"; $brush=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($part.color)); $g.FillPath($brush,$part.path); $brush.Dispose()}
  $svg+='</svg>'; [IO.File]::WriteAllText((Join-Path $out "$name.svg"),$svg); $bmp.Save((Join-Path $out "$name.png"),[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose();$bmp.Dispose()
}
ExportLogo 'simbolo-amarelo' 1024 1024 @((Part $symbol 8 112 112 $yellow)) $null
ExportLogo 'icone-home' 1024 1024 @((Part $symbol 6.4 192 192 $yellow)) '#090909'
ExportLogo 'simbolo-preto' 1024 1024 @((Part $symbol 8 112 112 '#090909')) $null
ExportLogo 'simbolo-branco' 1024 1024 @((Part $symbol 8 112 112 '#FFFFFF')) $null
$wb=$word.GetBounds(); $ws=1000/$wb.Width
ExportLogo 'letreiro-branco' 1100 220 @((Part $word $ws 50 35 '#FFFFFF')) $null
ExportLogo 'letreiro-preto' 1100 220 @((Part $word $ws 50 35 '#090909')) $null
ExportLogo 'letreiro-amarelo' 1100 220 @((Part $word $ws 50 35 $yellow)) $null
ExportLogo 'logo-horizontal' 1600 360 @((Part $symbol 2.6 50 50 $yellow),(Part $word (1100/$wb.Width) 400 110 '#FFFFFF')) $null
ExportLogo 'logo-vertical' 1200 1100 @((Part $symbol 5.5 325 80 $yellow),(Part $word (1000/$wb.Width) 100 760 '#FFFFFF')) $null
ExportLogo 'logo-vertical-fundo-preto' 1200 1100 @((Part $symbol 5.5 325 80 $yellow),(Part $word (1000/$wb.Width) 100 760 '#FFFFFF')) '#090909'
