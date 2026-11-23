<?php
namespace Tests\Feature;
use App\Models\AttendanceSession;
use App\Services\AttendanceCaptureWindow;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class SessionInactiveTest extends ProjectReviewRegressionTest
{
    private function sampleSession():AttendanceSession
    {
        return new AttendanceSession(['status'=>'active','start_time'=>Carbon::parse('2026-11-23 15:30 Asia/Manila'),'end_time'=>Carbon::parse('2026-11-23 16:30 Asia/Manila')]);
    }
    public function test_previous_day_session_is_inactive_at_philippine_midnight():void
    {
        $session=$this->sampleSession();Carbon::setTestNow(Carbon::parse('2026-11-23 23:59:59 Asia/Manila'));
        $this->assertSame('active',$session->status);
        Carbon::setTestNow(Carbon::parse('2026-11-24 00:00:00 Asia/Manila'));
        $this->assertSame('closed',$session->status);$this->assertFalse($session->isActive());
        $this->assertSame('closed',$session->toArray()['status']);
    }
    public function test_overnight_sessions_remain_active_through_their_final_day():void
    {
        $session=$this->sampleSession();$session->scheduled_end=Carbon::parse('2026-11-24 01:00 Asia/Manila');
        Carbon::setTestNow(Carbon::parse('2026-11-24 00:30 Asia/Manila'));$this->assertSame('active',$session->status);
        Carbon::setTestNow(Carbon::parse('2026-11-25 00:00 Asia/Manila'));$this->assertSame('closed',$session->status);
    }
    public function test_cancelled_and_manually_closed_states_are_preserved():void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-23 17:00 Asia/Manila'));
        foreach(['closed','cancelled'] as $status){$session=$this->sampleSession();$session->status=$status;$this->assertSame($status,$session->status);}
    }
    public function test_offline_original_capture_is_preserved_after_session_becomes_inactive():void
    {
        $session=$this->sampleSession();Carbon::setTestNow(Carbon::parse('2026-11-24 10:00 Asia/Manila'));
        $window=app(AttendanceCaptureWindow::class);
        $captured=$window->time($session,true,'2026-11-23T08:45:00Z');
        $this->assertTrue($captured->equalTo(Carbon::parse('2026-11-23 16:45 Asia/Manila')));
        foreach([[false,null],[true,'2026-11-24T00:01:00+08:00']] as [$offline,$time]){
            try{$window->time($session,$offline,$time);throw new \RuntimeException('Expired capture was accepted');}
            catch(ValidationException $e){$this->assertArrayHasKey('session_id',$e->errors());}
        }
    }
    public function test_missing_end_uses_start_day_instead_of_remaining_active_forever():void
    {
        $session=$this->sampleSession();$session->end_time=null;Carbon::setTestNow(Carbon::parse('2026-11-24 00:00 Asia/Manila'));
        $this->assertSame('closed',$session->status);
    }
    public function test_active_lookup_excludes_previous_days_but_keeps_today():void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-24 10:00 Asia/Manila'));
        $old=$this->sampleSession();$old->save();
        $current=AttendanceSession::create(['status'=>'active','start_time'=>now()->subHour(),'end_time'=>now()->addHour()]);
        $this->assertSame([$current->id],AttendanceSession::active()->pluck('id')->all());
        $this->assertSame('closed',$old->fresh()->status);
    }
}

