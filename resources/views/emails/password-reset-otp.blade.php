{{-- resources/views/emails/password-reset-otp.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 500px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0A1628 0%, #1a2a4a 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #D4AF37;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            color: rgba(255,255,255,0.6);
            margin: 5px 0 0;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a2e;
            margin-bottom: 10px;
        }
        .message {
            color: #4a4a6a;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .otp-box {
            background: #f0f4ff;
            border: 2px dashed #D4AF37;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #0A1628;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .otp-label {
            font-size: 12px;
            color: #6b6b8a;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .expiry {
            text-align: center;
            color: #d32f2f;
            font-size: 13px;
            margin-top: 10px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #6b6b8a;
            border-top: 1px solid #e9ecef;
        }
        .footer a {
            color: #D4AF37;
            text-decoration: none;
        }
        .divider {
            border: none;
            border-top: 1px solid #e9ecef;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 NSTP Office</h1>
            <p>Password Reset Request</p>
        </div>

        <div class="content">
            <div class="greeting">Hello, {{ $name }}!</div>
            
            <div class="message">
                We received a request to reset your password for your NSTP Management System account. 
                Use the OTP code below to complete the password reset process.
            </div>

            <div class="otp-box">
                <div class="otp-label">Your One-Time Password (OTP)</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>

            <div class="expiry">
                ⏰ This OTP will expire in <strong>10 minutes</strong>
            </div>

            <hr class="divider">

            <div style="font-size: 13px; color: #6b6b8a; text-align: center;">
                <p style="margin: 0;">If you didn't request a password reset, please ignore this email.</p>
                <p style="margin: 5px 0 0;">For security, never share this OTP with anyone.</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0;">
                &copy; {{ date('Y') }} <a href="#">NSTP Management System</a> • 
                All rights reserved.
            </p>
            <p style="margin: 5px 0 0; font-size: 11px;">
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>