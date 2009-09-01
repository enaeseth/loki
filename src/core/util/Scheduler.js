/**
 * @class Provides a more convenient interface to setTimeout and clearTimeout.
 * @author Eric Naeseth
 */
Util.Scheduler = function Scheduler()
{
	throw new Error('This is a static class; it does not make sense to call its constructor.');
}

Util.Scheduler.Error = function SchedulerError(message)
{
	Util.OOP.inherits(this, Error, message);
	this.name = 'Util.Scheduler.Error';
}

Util.Scheduler.Task = function SchedulerTask(callable)
{
	this.id = null;
	this.invoke = callable;
	
	this.runDelayed = function run_task_delayed(delay)
	{
		this.id = setTimeout(callable, delay * 1000);
	}
	
	this.runPeriodically = function run_task_periodically(interval)
	{
		var self = this;
		interval *= 1000;
		
		function standin() {
			self.invoke.apply(this, arguments);
			self.id = setTimeout(standin, interval);
		}
		
		this.id = setTimeout(standin, interval);
	}
	
	this.cancel = function cancel_task()
	{
		if (this.id === null) {
			throw new Util.Scheduler.Error('Nothing has been scheduled.');
		}
		clearTimeout(this.id);
		this.id = null;
	}
}

Util.Scheduler.delay = function sched_delay(func, delay)
{
	var task = new Util.Scheduler.Task(func);
	task.runDelayed(delay);
	return task;
}

Util.Scheduler.defer = function sched_defer(func)
{
	var task = new Util.Scheduler.Task(func);
	task.runDelayed(0.01 /* 10ms */);
	return task;
}

Util.Scheduler.runPeriodically = function sched_run_periodically(func, interval)
{
	var task = new Util.Scheduler.Task(func);
	task.runPeriodically(interval);
	return task;
}