<!-- resources/views/reports/deficiency.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <title>Deficiency Report</title>
    <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #0a1628; }
        .header p { color: #666; }
        .badge-danger { color: #dc3545; }
        .badge-warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NSTP Deficiency Report</h1>
        <p>Generated: {{ $generated_at->format('F d, Y h:i A') }}</p>
        <p><strong>Total Deficient Students: {{ $students->count() }}</strong></p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Component</th>
                <th>Completed Hours</th>
                <th>Missing Hours</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $student)
            @php
                $requiredHours = 90;
                $completedHours = $student->completed_training_hours ?? 0;
                $missingHours = max(0, $requiredHours - $completedHours);
            @endphp
            <tr>
                <td>{{ $student->student_id }}</td>
                <td>{{ $student->user->first_name }} {{ $student->user->last_name }}</td>
                <td>{{ strtoupper($student->nstp_component_selected ?? 'Not Assigned') }}</td>
                <td>{{ $completedHours }}</td>
                <td class="badge-danger">{{ $missingHours }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $student->completion_status ?? 'Pending')) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>