package org.web.entity;

import java.util.ArrayList;

import org.web.Console;
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

public class Bomb implements Runnable{
	
	private int id;
	private double x;
	private double y;
	private Player launcher;
	private Case curcell;
	private int skin;
	private TimerWaiter timer = new TimerWaiter();
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
		timer.addNext(this, 3000);
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

	public TimerWaiter getTimer() {
		return this.timer;
	}
	
	public TupleThree<Integer, ArrayList<Case>, ArrayList<Bomb>> explodeline(ArrayList<Case> cells)
	{
		int count = 0;
		ArrayList<Case> brokenWalls = new ArrayList<Case>();
		ArrayList<Bomb> bombToExplode = new ArrayList<Bomb>();
		for (Case cell : cells)
		{
			boolean pdie = false;
			for (Client c : Start.webServer.getClients())
			{
				if (c.player.getCurCell().getId() == cell.getId())
				{
					c.player.die(this);
					pdie = true;
				}
			}
			for (Bot b : World.bots)
			{
				if (b.getPlayer().getCurCell().getId() == cell.getId())
				{
					b.getPlayer().die(this);
					pdie = true;
				}
			}
			if (pdie)
				break ;
			if (cell.hasBomb())
			{
				bombToExplode.add(cell.getBomb());
				break ;
			}
			else if (!cell.isWalkable() && cell.getGroundId() == 104)
			{
				cell.setWalkable(true);
				cell.setGround(0);
				cell.sendCell();
				brokenWalls.add(cell);
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
	
	public void explode()
	{
		if (haveExplode) {
			this.curcell.addBomb(null);
			World.bombs.remove(this);
			return;
		}
		this.curcell.addBomb(null);
		World.bombs.remove(this);
		this.timer = null;
		haveExplode = true;
		this.launcher.setBombCounter(this.launcher.getBombCounter() - 1);
		ArrayList<Case> cellsup = World.map.getdircell(curcell, BinaryDirection.up.getId(), range);
		ArrayList<Case> cellsdown = World.map.getdircell(curcell, BinaryDirection.down.getId(), range);
		ArrayList<Case> cellsleft = World.map.getdircell(curcell, BinaryDirection.left.getId(), range);
		ArrayList<Case> cellsright = World.map.getdircell(curcell, BinaryDirection.right.getId(), range);

		TupleThree<Integer, ArrayList<Case>, ArrayList<Bomb>> sup = this.explodeline(cellsup);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Bomb>> down = this.explodeline(cellsdown);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Bomb>> left = this.explodeline(cellsleft);
		TupleThree<Integer, ArrayList<Case>, ArrayList<Bomb>> right = this.explodeline(cellsright);
		for (Client c : Start.webServer.getClients()) {
			if (c == null)
				continue;
			SocketSender.sendMessage(c, "BE" + this.id + "|" + sup.getFirst() + "|" + down.getFirst() + "|" + left.getFirst() + "|" + right.getFirst());
		}

		ArrayList<Bomb> bombsToExplode = new ArrayList<Bomb>();
		bombsToExplode.addAll(sup.getThird());
		bombsToExplode.addAll(down.getThird());
		bombsToExplode.addAll(left.getThird());
		bombsToExplode.addAll(right.getThird());

		for (Bomb b: bombsToExplode) {
			b.getTimer().addNext(b, 1);//.run();
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
		explode();
	}
}
