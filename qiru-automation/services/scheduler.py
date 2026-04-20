import asyncio
import json
from pathlib import Path
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from config import FOLLOWUP_DAYS

_scheduler: AsyncIOScheduler | None = None
_LEADS_FILE = Path("data/pending_followups.json")


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        jobstores = {"default": SQLAlchemyJobStore(url="sqlite:///data/jobs.db")}
        _scheduler = AsyncIOScheduler(jobstores=jobstores)
    return _scheduler


def schedule_followups(name: str, email: str):
    from services.email_service import send_followup_email

    scheduler = get_scheduler()
    for day in FOLLOWUP_DAYS:
        run_date = datetime.utcnow() + timedelta(days=day)
        job_id = f"followup_{email}_{day}d"
        scheduler.add_job(
            send_followup_email,
            "date",
            run_date=run_date,
            args=[name, email, day],
            id=job_id,
            replace_existing=True,
        )


def cancel_followups(email: str):
    scheduler = get_scheduler()
    for day in FOLLOWUP_DAYS:
        job_id = f"followup_{email}_{day}d"
        try:
            scheduler.remove_job(job_id)
        except Exception:
            pass
