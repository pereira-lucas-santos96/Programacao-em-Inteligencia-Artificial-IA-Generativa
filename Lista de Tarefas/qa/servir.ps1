param([ValidateRange(1024, 65535)][int]$Port = 8080)

# Servidor de arquivos estáticos, restrito ao loopback e à pasta deste projeto.
# Não executa scripts recebidos, não aceita gravações e não abre o navegador.
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$rootPrefix = $projectRoot.TrimEnd('\') + '\'
$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.svg' = 'image/svg+xml'
}
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Aplicação: http://127.0.0.1:$Port/atividade-bugs-lista-tarefas.html"
Write-Host "Testes:    http://127.0.0.1:$Port/qa/testar-proximo-passo.html"
Write-Host 'Pressione Ctrl+C para encerrar.'

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 3000
      $client.SendTimeout = 3000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($requestLine)) { continue }
      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) { continue }
      for ($lineCount = 0; $lineCount -lt 100; $lineCount++) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) { break }
      }
      $status = '404 Not Found'
      $mime = 'text/plain; charset=utf-8'
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Arquivo não encontrado.')
      if ($parts[0] -eq 'GET' -or $parts[0] -eq 'HEAD') {
        $relative = [System.Uri]::UnescapeDataString($parts[1].Split('?')[0]).TrimStart('/')
        if ($relative -eq '') { $relative = 'atividade-bugs-lista-tarefas.html' }
        $target = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
        $extension = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
        if ($target.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
            $mimeTypes.ContainsKey($extension) -and [System.IO.File]::Exists($target)) {
          $bytes = [System.IO.File]::ReadAllBytes($target)
          $mime = $mimeTypes[$extension]
          $status = '200 OK'
        }
      } else {
        $status = '405 Method Not Allowed'
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Somente leitura.')
      }
      $responseHeader = "HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($responseHeader)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($parts[0] -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
      $stream.Flush()
    } catch {
      Write-Verbose "Requisição encerrada: $($_.Exception.Message)"
    } finally {
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
