const cron = require('node-cron');
const supabase = require('../lib/supabase');
const { sendNotification } = require('../services/telegram'); // FIXED: correct path

/**
 * Job runs daily at 19:00 (7 PM):
 * - Auto-checks-out any still-present staff
 * - Marks absent staff with DB records
 * - Sends daily summary via Telegram
 */
function initScheduler() {
  cron.schedule('0 19 * * *', async () => {
    console.log('⏰ Running daily summary job...');
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*, staff(name)')
        .eq('date', today);

      if (error) throw error;

      const { data: staffList, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true);

      if (staffError) throw staffError;

      const presentStaff = [];
      const absentStaff = [];
      const lateStaff = [];
      let totalHours = 0;
      let countWithHours = 0;

      for (const staff of staffList) {
        const record = attendance?.find(a => a.staff_id === staff.id);

        if (!record || record.status === 'absent') {
          absentStaff.push(staff.name);
          if (!record) {
            await supabase.from('attendance').insert({
              staff_id: staff.id,
              date: today,
              status: 'absent',
            });
          }
        } else {
          presentStaff.push(staff.name);

          // Auto-checkout if not departed
          if (record.status !== 'departed') {
            await supabase
              .from('attendance')
              .update({ status: 'departed', evening_departure: new Date().toISOString() })
              .eq('id', record.id);
          }

          if (record.total_hours) {
            totalHours += parseFloat(record.total_hours);
            countWithHours++;
          }

          // Late check: after 9:15 AM
          if (record.morning_arrival) {
            const arrivalTime = new Date(record.morning_arrival);
            if (arrivalTime.getHours() > 9 || (arrivalTime.getHours() === 9 && arrivalTime.getMinutes() > 15)) {
              lateStaff.push(staff.name);
            }
          }
        }
      }

      const avgHours = countWithHours > 0 ? (totalHours / countWithHours).toFixed(1) : 0;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      const message =
        `📊 *Daily Summary — ${dateStr}*\n\n` +
        `✅ *Present (${presentStaff.length}):* ${presentStaff.join(', ') || 'None'}\n` +
        `❌ *Absent (${absentStaff.length}):* ${absentStaff.join(', ') || 'None'}\n` +
        `⏰ *Late:* ${lateStaff.join(', ') || 'None'}\n` +
        `⌛ *Avg hours:* ${avgHours} hrs`;

      await sendNotification(message);
    } catch (err) {
      console.error('❌ Error in daily summary job:', err);
    }
  });

  console.log('⏰ Scheduler initialized (daily summary at 7 PM)');
}

module.exports = { initScheduler };
