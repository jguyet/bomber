package org.web.entity;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

import org.web.Start;
import org.web.bot.Bot;
import org.web.client.Client;
import org.web.client.message.SocketSender;
import org.web.enums.BinaryDirection;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.TimerWaiter;
import org.web.utils.Tuple;
import org.web.utils.TupleThree;

public class Bomb extends TimerTask {
	
	private int id;
	private double x;
	private double y;
	private Player launcher;
	private Case curcell;
	private int skin;
	private Timer timer = new Timer();
	private int range = 4;
	private boolean haveExplode = false;

	public Bomb(int id, double x, double y, Player launcher, int skin)
	{
		this.id = id;
		this.x = x;
		this.y = y;
		this.launcher = launcher;
		this.curcell = launcher.getCurCell();
		this.skin = skin;
		this.range = launcher.getRange();
		this.curcell.addBomb(this);
		timer.schedule(this, 3000);
	}
	
	public int getId()
	{
		return (id);
	}
	
	public double getx()
	{
		return (x);
	}
	
	public double gety()
	{
		return (y);
	}
	
	public Player getLauncher()
	{
		return (launcher);
	}
	
	public Case getCurCell()
	{
		return (curcell);
	}
	
	public int getskin()
	{
		return (skin);
	}
	
	public int getrange()
	{
		return (this.range);
	}

	public void setTimer(Timer timer) {
		this.timer = timer;
	}

	public Timer getTimer() {
		return this.timer;
	}
	
	public TupleThree<Integer, ArrayList<Case>, ArrayList<Tuple<Bomb, BinaryDirection>>> explodeline(ArrayList<Case> cells, BinaryDirection dir)
	{
		int count = 0;
		ArrayList<Case> brokenWalls = new ArrayList<Case>();
		ArrayList<Tuple<Bomb, BinaryDirection>> bombToExplode = new ArrayList<Tuple<Bomb, BinaryDirection>>();
		ArrayList<Bot> bots = new ArrayList<>(World.bots);
		for (Case cell : cells)
		{
			boolean pdie = false;
			for (Client c : Start.webServer.getClients())
			{
				if (c.player.getCurCell().getId() == cell.getId())
				{
//					if (this.launcher.getBot() != null) {
//						this.launcher.getBot().addToScore(1.0); // killed one player
//					}
					c.player.die(this);
					pdie = true;
				}
			}
			for (Bot b : bots)
			{
				if (b != null && b.getPlayer().getCurCell().getId() == cell.getId())
				{
					if (this.launcher.getBot() != null && b.getPlayer().getId() == this.launcher.getId()) {
//						this.launcher.getBot().addToScore(-50.0); // died by his bomb
//						this.launcher.getBot().trainDeath(this);
					} else if (this.launcher.getBot() != null) {
//						this.launcher.getBot().addToScore(500.0); // killed one bot
					}
					b.getPlayer().die(this);
					pdie = true;
				}
			}
			if (pdie)
				break ;
			if (cell.hasBomb())
			{
				bombToExplode.add(new Tuple<>(cell.getBomb(), dir));
//				cell.getBomb().explode(this, dir);
				break ;
			}
			else if (!cell.isWalkable() && cell.getGroundId() == 104)
			{
				cell.setWalkable(true);
				cell.setGround(0);
				cell.sendCell();
				brokenWalls.add(cell);
				if (this.launcher.getBot() != null) {
					this.launcher.getBot().addToScore(50); // destructed a wall
				}
				count++;
				break ;
			}
			else if (!cell.isWalkable() && cell.getGroundId() == 80)
			{
				cell.setGround(81);
				cell.sendCell();
				break ;
			}
			else if (!cell.isWalkable())
				break ;
			count++;
		}
		return (new TupleThree<>(count, brokenWalls, bombToExplode));
	}
	
	public void explode(Bomb from, BinaryDirection dir)
	{
		this.timer.cancel();
		if (haveExplode) {
			this.curcell.addBomb(null);
			World.bombs.remove(this);
			return;
		}
		haveExplode = true;
		this.curcell.addBomb(null);
		World.bombs.remove(this);

		BinaryDirection directionToSkip = null;

		if (from != null) {
			if (dir == BinaryDirection.left) {
				directionToSkip = BinaryDirection.right;
			}
			if (dir == BinaryDirection.right) {
				directionToSkip = BinaryDirection.left;
			}
			if (dir == BinaryDirection.up) {
				directionToSkip = BinaryDirection.down;
			}
			if (dir == BinaryDirection.down) {
				directionToSkip = BinaryDirection.up;
			}
		}

		this.launcher.setBombCounter(this.launcher.getBombCounter() - 1);
		ArrayList<Case> cellsup = directionToSkip == BinaryDirection.up ? new ArrayList<>() : World.map.getdircell(curcell, BinaryDirection.up.getId(), range);
		ArrayList<Case> cellsdown = directionToSkip == BinaryDirection.down ? new ArrayList<>() : World.map.getdircell(curcell, BinaryDirection.down.getId(), range);
		ArrayList<Case> cellsleft = directionToSkip == BinaryDirection.left ? new ArrayList<>() : World.map.getdircell(curcell, BinaryDirection.left.getId(), range);
		ArrayList<Case> cellsright = directionToSkip == BinaryDirection.right ? new ArrayList<>() : World.map.getdircell(curcell, BinaryDirection.right.getId(), range);

		ArrayList<Case> current = new ArrayList<>();
		current.add(this.curcell);
		this.explodeline(current, BinaryDirection.all);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Tuple<Bomb, BinaryDirection>>> sup = this.explodeline(cellsup, BinaryDirection.up);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Tuple<Bomb, BinaryDirection>>> down = this.explodeline(cellsdown, BinaryDirection.down);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Tuple<Bomb, BinaryDirection>>> left = this.explodeline(cellsleft, BinaryDirection.left);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Tuple<Bomb, BinaryDirection>>> right = this.explodeline(cellsright, BinaryDirection.right);

		for (Client c : Start.webServer.getClients()) {
			if (c == null)
				continue;
			SocketSender.sendMessage(c, "BE" + this.id + "|" + sup.getFirst() + "|" + down.getFirst() + "|" + left.getFirst() + "|" + right.getFirst());
		}

		ArrayList<Tuple<Bomb, BinaryDirection>> bombsToExplode = new ArrayList<Tuple<Bomb, BinaryDirection>>();
		bombsToExplode.addAll(sup.getThird());
		bombsToExplode.addAll(down.getThird());
		bombsToExplode.addAll(left.getThird());
		bombsToExplode.addAll(right.getThird());

		for (Tuple<Bomb, BinaryDirection> b: bombsToExplode) {
			if (!b.getFirst().haveExplode) {
				try {
					Bomb tmp = this;
//					b.getFirst().getTimer().cancel();
					b.getFirst().timer.schedule(new TimerTask() {
						@Override
						public void run() {
							b.getFirst().timer.cancel();
							b.getFirst().explode(tmp, b.getSecond());
						}
					}, 100);
				} catch (Exception e) {}
			}
		}

		ArrayList<Case> brokenWalls = new ArrayList<Case>();
		brokenWalls.addAll(sup.getSecond());
		brokenWalls.addAll(down.getSecond());
		brokenWalls.addAll(left.getSecond());
		brokenWalls.addAll(right.getSecond());

		for (Case c: brokenWalls) {
			World.addItem(c);
		}
	}

	@Override
	public void run() {
		explode(null, null);
	}
}
