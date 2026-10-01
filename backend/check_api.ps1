$regBody = @{ name="Test"; email="apicheck@tradeflow.com"; password="password123" } | ConvertTo-Json
$r = Invoke-WebRequest -Uri 'http://localhost:3002/api/v1/auth/register' -Method POST -ContentType 'application/json' -Body $regBody -UseBasicParsing
$token = ($r.Content | ConvertFrom-Json).data.token
$headers = @{ Authorization = "Bearer $token" }
$holdRes = Invoke-WebRequest -Uri 'http://localhost:3002/api/v1/portfolio/holdings' -Headers $headers -UseBasicParsing
Write-Host "Holdings response:"
Write-Host $holdRes.Content
