package org.web.utils;

import java.util.Deque;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.web.Console;

public class TimerWaiter implements Runnable
{
	private Deque<Instance>					waitingList	= new ConcurrentLinkedDeque<>();
	//private static ScheduledExecutorService	scheduler	= Executors.newSingleThreadScheduledExecutor();
	private static ScheduledExecutorService	scheduler	= Executors.newScheduledThreadPool(10);

	private void scheduleNextTask()
	{
		try
		{
			final Long time = waitingList.getFirst().getTime();
			launch(this, time);
		}
		catch (Exception e)
		{
			//sendError(e);
		}
	}

	public void run()
	{
		try
		{
			if (waitingList.isEmpty())
			{
				sendError(new Exception("WaitingList est vide"));
				return;
			}

			Instance instance = waitingList.pop();

			if (!waitingList.isEmpty())
				scheduleNextTask();

			instance.getRunnable().run();
		}
		catch (Exception e)
		{
			//sendError(e);
		}
	}

	public void addNext(Runnable run, long put, TimeUnit unit)
	{
		try
		{
			long time = TimeUnit.MILLISECONDS.convert(put, unit);
			this.waitingList.addLast((new Instance(run, Long.valueOf(time))));
			if (this.waitingList.size() == 1)
				scheduleNextTask();
		}
		catch (Exception e)
		{
			//sendError(e);
		}
	}

	public void addNext(Runnable run, long time)
	{
		try
		{
			addNext(run, time, TimeUnit.MILLISECONDS);
		}
		catch (Exception e)
		{
			//sendError(e);
		}
	}

	public void addNow(Runnable run, long put, TimeUnit unit)
	{
		try
		{
			long time = TimeUnit.MILLISECONDS.convert(put, unit);
			launch(run, time);
		}
		catch (Exception e)
		{
			sendError(e);
		}
	}

	public void addNow(Runnable run, long put)
	{
		try
		{
			addNow(run, put, TimeUnit.MILLISECONDS);
		}
		catch (Exception e)
		{
			sendError(e);
		}
	}

	private void checkExecutor()
	{
		try
		{
			//Console.println("checkExecutor : isShutDown " + scheduler.isShutdown() + ", isTerminated " + scheduler.isTerminated(), Console.Color.GAME);
			if (scheduler.isShutdown())
			{
				(new Exception("Scheduler Shutdown")).printStackTrace();
				Console.println("Scheduler Shutdown", Console.Color.ERROR);
				scheduler = Executors.newScheduledThreadPool(5);
			}
		}
		catch (Exception e)
		{
			sendError(e);
		}
	}

	private synchronized void launch(Runnable run, long time)
	{
		try
		{
			checkExecutor();
			scheduler.schedule(run, time, TimeUnit.MILLISECONDS);
		}
		catch (Exception e)
		{
			sendError(e);
		}
	}

	private void sendError(Exception e)
	{
		e.printStackTrace();
		Console.println("Erreur TimerWaiter : " + e.getMessage(), Console.Color.ERROR);
	}
}

class Instance
{
	private Runnable	runnable;
	private Long		time;

	public Instance(Runnable runnable, Long time)
	{
		this.runnable = runnable;
		this.time = time;
	}

	public Runnable getRunnable()
	{
		return runnable;
	}

	public Long getTime()
	{
		return time;
	}
}