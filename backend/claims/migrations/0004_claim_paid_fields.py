from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('claims', '0003_claim_status_note'),
    ]

    operations = [
        migrations.AddField(
            model_name='claim',
            name='paid_amount',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Amount paid out', max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name='claim',
            name='payout_date',
            field=models.DateField(blank=True, help_text='When payout was completed', null=True),
        ),
        migrations.AlterField(
            model_name='claim',
            name='status',
            field=models.CharField(choices=[('SUBMITTED', 'Submitted'), ('IN_REVIEW', 'In Review'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('PAID', 'Paid')], default='SUBMITTED', max_length=20),
        ),
    ]
