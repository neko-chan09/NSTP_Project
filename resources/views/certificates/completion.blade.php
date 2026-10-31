<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Completion</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Serif', Georgia, serif;
            width: 297mm;
            height: 210mm;
            position: relative;
            background: #fdfbf5;
        }

        /* === Outer decorative border === */
        .outer-border {
            position: absolute;
            inset: 12mm;
            border: 3px double #0A1628;
            padding: 4px;
        }
        .inner-border {
            position: absolute;
            inset: 14mm;
            border: 1px solid #D4AF37;
        }

        /* === Corner ornaments === */
        .corner {
            position: absolute;
            width: 30mm;
            height: 30mm;
            border: 3px solid #D4AF37;
        }
        .corner-tl { top: 14mm; left: 14mm; border-right: none; border-bottom: none; }
        .corner-tr { top: 14mm; right: 14mm; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 14mm; left: 14mm; border-right: none; border-top: none; }
        .corner-br { bottom: 14mm; right: 14mm; border-left: none; border-top: none; }

        /* === Watermark seal (center) === */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 180mm;
            opacity: 0.04;
        }

        /* === Content === */
        .content {
            position: relative;
            padding: 35mm 30mm;
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* === Header === */
        .logo {
            width: 22mm;
            height: 22mm;
            margin-bottom: 3mm;
        }
        .school-name {
            font-size: 13pt;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #0A1628;
            font-weight: normal;
        }
        .office-name {
            font-size: 10pt;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #666;
            margin-top: 2mm;
        }
        .divider-gold {
            width: 60mm;
            height: 2px;
            background: linear-gradient(to right, transparent, #D4AF37, transparent);
            margin: 6mm auto;
        }

        /* === Title === */
        .title {
            font-size: 34pt;
            color: #0A1628;
            letter-spacing: 6px;
            text-transform: uppercase;
            margin-bottom: 2mm;
            font-family: 'DejaVu Serif', Georgia, serif;
        }
        .subtitle {
            font-size: 12pt;
            color: #D4AF37;
            letter-spacing: 5px;
            text-transform: uppercase;
            margin-bottom: 10mm;
        }

        /* === Body === */
        .presented-to {
            font-size: 11pt;
            color: #666;
            font-style: italic;
            margin-bottom: 4mm;
        }
        .student-name {
            font-size: 28pt;
            color: #0A1628;
            font-weight: bold;
            border-bottom: 1px solid #999;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
            display: inline-block;
            min-width: 140mm;
            font-family: 'DejaVu Serif', Georgia, serif;
        }
        .student-meta {
            font-size: 10pt;
            color: #666;
            margin-bottom: 8mm;
        }

        .body-text {
            font-size: 11pt;
            color: #333;
            line-height: 1.8;
            max-width: 200mm;
            margin: 0 auto 4mm;
        }

        .component-badge {
            display: inline-block;
            padding: 2mm 6mm;
            background: #0A1628;
            color: #D4AF37;
            font-size: 11pt;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin: 4mm 0;
        }

        /* === Footer with signatures + QR === */
        .footer {
            position: absolute;
            bottom: 30mm;
            left: 30mm;
            right: 30mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .signature-block {
            text-align: center;
            width: 65mm;
        }
        .signature-line {
            border-top: 1px solid #333;
            padding-top: 2mm;
            font-size: 11pt;
            font-weight: bold;
            color: #0A1628;
        }
        .signature-title {
            font-size: 9pt;
            color: #666;
            font-style: italic;
        }

        /* === QR area === */
        .qr-block {
            text-align: center;
        }
        .qr-block img {
            width: 25mm;
            height: 25mm;
        }
        .qr-label {
            font-size: 7pt;
            color: #999;
            margin-top: 1mm;
        }

        /* === Certificate number === */
        .cert-number {
            position: absolute;
            top: 20mm;
            right: 30mm;
            font-size: 8pt;
            color: #999;
            font-family: 'Courier New', monospace;
        }
        .date-issued {
            position: absolute;
            top: 20mm;
            left: 30mm;
            font-size: 8pt;
            color: #999;
        }
    </style>
</head>
<body>

    {{-- Corner ornaments --}}
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    {{-- Outer borders --}}
    <div class="outer-border"></div>
    <div class="inner-border"></div>

    {{-- Meta info (top corners) --}}
    <div class="date-issued">Issued: {{ $issued_at }}</div>
    <div class="cert-number">No. {{ $certificate_number }}</div>

    {{-- Main content --}}
    <div class="content">

        <img src="{{ $logo_data_uri }}" alt="NSTP Logo" class="logo">

        <div class="school-name">Opol Community College</div>
        <div class="office-name">National Service Training Program</div>

        <div class="divider-gold"></div>

        <div class="title">Certificate</div>
        <div class="subtitle">of Completion</div>

        <div class="presented-to">This certificate is proudly presented to</div>

        <div class="student-name">{{ $student_name }}</div>

        <div class="student-meta">
            Student ID: {{ $student_id }}
            &nbsp;•&nbsp;
            {{ $course }}
            &nbsp;•&nbsp;
            {{ $year_level }}
        </div>

        <div class="body-text">
            for having successfully completed the requirements of the
            National Service Training Program under the
        </div>

        <div class="component-badge">{{ $component }}</div>

        <div class="body-text">
            completing a total of <strong>{{ $hours_completed }} training hours</strong>
            during the {{ $semester }}, School Year {{ $school_year }}.
        </div>

    </div>

    {{-- Footer: signatures + QR --}}
    <div class="footer">

        {{-- Left signature --}}
        <div class="signature-block">
            <div class="signature-line">{{ $coordinator_name }}</div>
            <div class="signature-title">NSTP Coordinator</div>
        </div>

        {{-- QR Code (center) --}}
        <div class="qr-block">
            <img src="{{ $qr_code_data_uri }}" alt="QR">
            <div class="qr-label">Scan to verify</div>
        </div>

        {{-- Right signature --}}
        <div class="signature-block">
            <div class="signature-line">{{ $dean_name }}</div>
            <div class="signature-title">Dean, Student Affairs</div>
        </div>

    </div>

</body>
</html>