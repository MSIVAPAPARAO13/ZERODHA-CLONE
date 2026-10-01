$loginBody = '{"email":"test@tradeflow.com","password":"password123"}'
try {
  $loginRes = Invoke-WebRequest -Uri 'http://localhost:3002/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody -UseBasicParsing
  $data = ($loginRes.Content | ConvertFrom-Json)
  $token = $data.data.token
  if (-not $token) { 
    Write-Host "LOGIN_FAILED: No token. Response: $($loginRes.Content)"
    exit 1 
  }
  Write-Host "LOGIN OK - Token acquired"
} catch {
  Write-Host "LOGIN_FAILED: $($_.Exception.Message)"
  # Try to register first
  $regBody = '{"name":"Test User","email":"test@tradeflow.com","password":"password123"}'
  try {
    $regRes = Invoke-WebRequest -Uri 'http://localhost:3002/api/v1/auth/register' -Method POST -ContentType 'application/json' -Body $regBody -UseBasicParsing
    $data = ($regRes.Content | ConvertFrom-Json)
    $token = $data.data.token
    Write-Host "REGISTERED & LOGIN OK"
  } catch {
    Write-Host "REGISTER_FAILED: $($_.Exception.Message)"
    exit 1
  }
}

$headers = @{ Authorization = "Bearer $token" }

$endpoints = @(
  "GET /api/v1/portfolio/holdings",
  "GET /api/v1/portfolio/positions",
  "GET /api/v1/orders",
  "GET /api/v1/account/balance",
  "GET /api/v1/account/transactions",
  "GET /api/v1/watchlist",
  "GET /api/v1/alerts",
  "GET /api/v1/journal",
  "GET /api/v1/playbooks",
  "GET /api/v1/insights/today",
  "GET /api/v1/events",
  "GET /api/v1/market-events",
  "GET /api/v1/scenarios",
  "GET /api/v1/strategies",
  "GET /api/v1/scanners",
  "GET /api/v1/research/sessions",
  "GET /api/v1/market/quotes"
)

foreach ($ep in $endpoints) {
  $parts = $ep -split " "
  $method = $parts[0]
  $path = $parts[1]
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3002$path" -Method $method -Headers $headers -UseBasicParsing -TimeoutSec 15
    Write-Host "OK  $($r.StatusCode)  $path"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "FAIL $code  $path  [$($_.Exception.Message.Substring(0,[Math]::Min(80,$_.Exception.Message.Length)))]"
  }
}

# Test order placement
Write-Host ""
Write-Host "--- Testing Order Placement ---"
$orderBody = '{"name":"RELIANCE","qty":1,"price":2800,"mode":"BUY"}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3002/api/v1/orders/new" -Method POST -ContentType 'application/json' -Headers $headers -Body $orderBody -UseBasicParsing
  Write-Host "POST ORDER OK  $($r.StatusCode)"
} catch {
  Write-Host "POST ORDER FAIL  $($_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length)))"
}

# Test alert create
Write-Host ""
Write-Host "--- Testing Alert Creation ---"
$alertBody = '{"symbol":"RELIANCE","condition":"ABOVE","targetPrice":3000}'
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3002/api/v1/alerts" -Method POST -ContentType 'application/json' -Headers $headers -Body $alertBody -UseBasicParsing
  Write-Host "POST ALERT OK  $($r.StatusCode)"
} catch {
  Write-Host "POST ALERT FAIL  $($_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length)))"
}

Write-Host ""
Write-Host "=== SCAN COMPLETE ==="
