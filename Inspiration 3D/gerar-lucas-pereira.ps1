$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::new(2048, 1536)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#070e14'))
$random = [System.Random]::new(108)
$glowPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$glowPath.AddEllipse(100, 120, 1848, 1250)
$glow = [System.Drawing.Drawing2D.PathGradientBrush]::new($glowPath)
$glow.CenterColor = [System.Drawing.ColorTranslator]::FromHtml('#163d43')
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 7, 14, 20))
$graphics.FillEllipse($glow, 100, 120, 1848, 1250)
$glow.Dispose(); $glowPath.Dispose()
for ($i = 0; $i -lt 450; $i++) {
  $x = $random.Next(60, 1988); $y = $random.Next(60, 1476)
  $radius = 1 + $random.NextDouble() * 2
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($random.Next(20, 110), 175, 217, 217))
  $graphics.FillEllipse($brush, [single]$x, [single]$y, [single]$radius, [single]$radius)
  $brush.Dispose()
}
for ($i = 0; $i -lt 5; $i++) {
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb((60 - $i * 8), 152, 194, 178), 1.2)
  $graphics.DrawEllipse($pen, (380 - $i * 45), (1195 - $i * 8), (1288 + $i * 90), (130 + $i * 16))
  $pen.Dispose()
}
$family = [System.Drawing.FontFamily]::new('Segoe UI')
$lines = @(
  @{ text='Lucas'; y=360; top='#effff5'; bottom='#79bcb4'; side='#193a40'; edge='#d2f3e3' },
  @{ text='Pereira'; y=735; top='#fff5d8'; bottom='#b9a06b'; side='#3f352b'; edge='#f0dfb7' }
)
foreach ($line in $lines) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddString($line.text, $family, [int][System.Drawing.FontStyle]::Bold, 410, [System.Drawing.PointF]::new(0, 0), [System.Drawing.StringFormat]::GenericTypographic)
  $bounds = $path.GetBounds()
  $matrix = [System.Drawing.Drawing2D.Matrix]::new()
  $matrix.Translate([single](1024 - $bounds.X - $bounds.Width / 2 - 22), [single]($line.y - $bounds.Y))
  $path.Transform($matrix); $matrix.Dispose()
  $bounds = $path.GetBounds()
  $shadowPath = $path.Clone()
  $matrix = [System.Drawing.Drawing2D.Matrix]::new(); $matrix.Translate(62, 86)
  $shadowPath.Transform($matrix); $matrix.Dispose()
  $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(125, 0, 0, 0))
  $graphics.FillPath($shadowBrush, $shadowPath)
  $shadowBrush.Dispose(); $shadowPath.Dispose()
  $sideBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($line.side))
  for ($depth = 70; $depth -ge 1; $depth--) {
    $sidePath = $path.Clone()
    $matrix = [System.Drawing.Drawing2D.Matrix]::new()
    $matrix.Translate([single]($depth * .7), [single]($depth * .9))
    $sidePath.Transform($matrix)
    $graphics.FillPath($sideBrush, $sidePath)
    $matrix.Dispose(); $sidePath.Dispose()
  }
  $sideBrush.Dispose()
  $edge = [System.Drawing.ColorTranslator]::FromHtml($line.edge)
  for ($width = 18; $width -ge 6; $width -= 4) {
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(8, $edge), $width)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $graphics.DrawPath($pen, $path); $pen.Dispose()
  }
  $face = [System.Drawing.Drawing2D.LinearGradientBrush]::new($bounds, [System.Drawing.ColorTranslator]::FromHtml($line.top), [System.Drawing.ColorTranslator]::FromHtml($line.bottom), 90.0)
  $graphics.FillPath($face, $path); $face.Dispose()
  $outline = [System.Drawing.Pen]::new($edge, 2.2)
  $outline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.DrawPath($outline, $path)
  $outline.Dispose(); $path.Dispose()
}
$family.Dispose()
$outputPath = Join-Path $PSScriptRoot 'Lucas Pereira - 3D.png'
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose()
Write-Output $outputPath
