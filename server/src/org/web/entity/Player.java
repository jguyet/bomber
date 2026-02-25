package org.web.entity;

import java.io.File;
import java.util.ArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.nd4j.linalg.dataset.DataSet;
import org.nd4j.linalg.dataset.MultiDataSet;
import org.web.Console;
import org.web.Start;
import org.web.bot.Bot;
import org.web.bot.ai.BotAI;
import org.web.client.Client;
import org.web.client.formatter.Formatter;
import org.web.client.message.SocketSender;
import org.web.enums.BinaryDirection;
import org.web.enums.PlayerDirection;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.TimerWaiter;

public class Player implements Runnable{
	
	private int id;
	private double x;
	private double y;
	private int skin;
	private int dir;
	private ScheduledExecutorService	movescheduler = null;
	private boolean onmove = false;
	private Client client;
	private int olddir = 1;
	private int range = 2;
	private double speed = 1.5;
	private int maxBombs = 1;
	private int bombCounter = 0;
	private Bot bot = null;
	private int currentAction = 0;
	private BotAI botAI = null;
	private long lastRefreshTime = 0;
	private boolean alive = true;
	private ArrayList<DataSet> dataSets = new ArrayList<>();

	public Player(int id, double x, double y, int skin, Client client, Bot bot)
	{
		this.id = id;
		this.x = x;
		this.y = y;
		this.skin = skin;
		this.dir = 0;
		this.client = client;
		this.bot = bot;
		if (this.bot == null) {
			movescheduler = Executors.newScheduledThreadPool(1);
			movescheduler.scheduleAtFixedRate(this, 1000 / 60, 1000 / 60, TimeUnit.MILLISECONDS);
//			this.botAI = new BotAI();
		}
		this.lastRefreshTime = System.currentTimeMillis();
	}
	
	public int getId()
	{
		return (id);
	}
	
	public double getx()
	{
		return (x);
	}
	
	public void setx(double d)
	{
		this.x = d;
	}
	
	public double gety()
	{
		return (y);
	}
	
	public void sety(double y)
	{
		this.y = y;
	}

	public double getSpeed() {
		return this.speed;
	}

	public Bot getBot() {
		return this.bot;
	}
	
	public int getskin()
	{
		return (skin);
	}
	
	public void setskin(int skin)
	{
		this.skin = skin;
	}

	public int getRange() {
		return this.range;
	}

	public void setRange(int range) {
		this.range = range;
	}

	public int getMaxBombs() {
		return this.maxBombs;
	}

	public void setMaxBombs(int maxBombs) {
		this.maxBombs = maxBombs;
	}

	public int getBombCounter() {
		return this.bombCounter;
	}

	public void setBombCounter(int counter) {
		this.bombCounter = counter;
	}
	
	public int getClientDirection()
	{
		if (this.dir == 0)
			return (olddir);
		if ((this.dir & BinaryDirection.up.getId()) != 0)
			return (0);
		if ((this.dir & BinaryDirection.right.getId()) != 0)
			return (1);
		if ((this.dir & BinaryDirection.down.getId()) != 0)
			return (2);
		if ((this.dir & BinaryDirection.left.getId()) != 0)
			return (3);
		return (olddir);
	}
	
	public int getDirection()
	{
		return (this.dir);
	}
	
	public void setDirection(int d)
	{
		this.dir = d;
		if (d != 0)
			olddir = getClientDirection();
	}
	
	public Case getCurCell()
	{
		return (World.map.getCellPos(x, y));
//		return (World.map.getCellPos(x + 10, y + 10));
	}
	
	public Case getposibleCell(double x2, double y2)
	{
		double tmpX = x + x2;
		double tmpY = y + y2;
		if (tmpX < 0) {
			tmpX = (World.map.getwidth() * 32) - (-tmpX);
		}
		if (tmpY < 0) {
			tmpY = (World.map.getheight() * 32) - (-tmpY);
		}
		return (World.map.getCellPos(tmpX, tmpY));
//		return (World.map.getCellPos(x + 10 + x2, y + 10 + y2));
	}

	public int getMove() {
		return this.onmove ? 1 : 0;
	}
	
	public void setonMove(boolean move)
	{
		this.onmove = move;
	}

	public void setLastRefreshTime(long time) {
		this.lastRefreshTime = time;
	}

	public boolean addBomb() {
		if (World.addBomb(client.player)) {
			this.currentAction = 5;
			this.trainAI();
			return true;
		}
		return false;
	}

	public int getBestDirectionFromCurrentPosition() {
		double baseX = x / 32;
		double baseY = y / 32;
		if (baseY <= 5) { // en haut
			return 3;
		}
		if (baseY >= 32 - 5) { // en bas
			return 4;
		}
		if (baseX <= 16) { // a gauche
			return 1;
		}
		if (baseX > 16) { // a droite
			return 2;
		}
		return 1;
	}
	
	public boolean move()
	{
		long now = System.currentTimeMillis(); // Temps actuel
		double deltaTime = (now - this.lastRefreshTime) / (1000.0 / 60); // Temps écoulé en secondes
		this.lastRefreshTime = now;

		if (!this.onmove || !this.alive) {
			this.currentAction = 0;
			return false;
		}

		double speedForMove = speed;
		if ((this.dir & 16) != 0 && this.dir != 16 || (this.dir & 4) != 0 && this.dir != 4 || (this.dir & 32) != 0 && this.dir != 32 || (this.dir & 8) != 0 && this.dir != 8) {
			speedForMove *= 0.9;
		}

		double speedWithDiff = deltaTime * speedForMove;

		if ((this.dir & BinaryDirection.up.getId()) != 0)
		{
			Case c = getposibleCell(0.0, -speedWithDiff);
			while (c == null || !c.isWalkableCheckBomb(this)) {
				speedWithDiff -= 0.1;
				if (speedWithDiff <=0) {
					break ;
				}
				c = getposibleCell(0.0, -speedWithDiff);
			}
			if (speedWithDiff > 0) {
				y -= speedWithDiff;
				if (this.bot != null) {
					this.bot.addToScore(0.00001); // moved
				}
				this.currentAction = 2;
				this.trainAI();
			}
		}
		if ((this.dir & BinaryDirection.down.getId()) != 0)
		{
			Case c = getposibleCell(0.0, speedWithDiff);
			while (c == null || !c.isWalkableCheckBomb(this)) {
				speedWithDiff -= 0.1;
				if (speedWithDiff <=0) {
					break ;
				}
				c = getposibleCell(0.0, speedWithDiff);
			}
			if (speedWithDiff > 0) {
				y += speedWithDiff;
				if (this.bot != null) {
					this.bot.addToScore(0.00001); // moved
				}
				this.currentAction = 3;
				this.trainAI();
			}
		}
		if ((this.dir & BinaryDirection.left.getId()) != 0)
		{
			Case c = getposibleCell(-speedWithDiff, 0.0);
			while (c == null || !c.isWalkableCheckBomb(this)) {
				speedWithDiff -= 0.1;
				if (speedWithDiff <=0) {
					break ;
				}
				c = getposibleCell(-speedWithDiff, 0.0);
			}
			if (speedWithDiff > 0) {
				x -= speedWithDiff;
				if (this.bot != null) {
					this.bot.addToScore(0.00001); // moved
				}
				this.currentAction = 1;
				this.trainAI();
			}
		}
		if ((this.dir & BinaryDirection.right.getId()) != 0)
		{
			Case c = getposibleCell(speedWithDiff, 0.0);
			while (c == null || !c.isWalkableCheckBomb(this)) {
				speedWithDiff -= 0.1;
				if (speedWithDiff <=0) {
					break ;
				}
				c = getposibleCell(speedWithDiff, 0.0);
			}
			if (speedWithDiff > 0) {
				x += speedWithDiff;
				if (this.bot != null) {
					this.bot.addToScore(0.00001); // moved
				}
				this.currentAction = 4;
				this.trainAI();
			}
		}

		if (x < 0) {
			x = (World.map.getwidth() * 32) - (-x);
		}
		if (y < 0) {
			y = (World.map.getheight() * 32) - (-y);
		}

		Case curCell = this.getCurCell();
		if (curCell != null && curCell.hasItem()) {
			Item item = curCell.getItem();

			item.disappear();

			if (this.bot != null) {
				this.bot.addToScore(0.01); // drop
			}

			// todo activate carac of item on player
			if (item.getTemplateId() == 4) {
				this.setRange(this.getRange() + 1);
			}
			if (item.getTemplateId() == 6) {
				this.speed += 0.1;
				for (Client ci : Start.webServer.getClients())
				{
					if (ci == null)
						continue ;
					SocketSender.sendMessage(ci, "IS"
							+ this.getId()
							+ "|" + this.speed);
				}
			}
			if (item.getTemplateId() == 0) {
				this.setMaxBombs(this.getMaxBombs() + 1);
			}
		}
		return true;
	}

	public void saveModel() {
		if (this.botAI == null) {
			return ;
		}
		try {
			MultiDataSet multiDataSet = this.botAI.buildMultiDataSet(this.dataSets);
			File file = new File("./MultiDataSet.zip");
			multiDataSet.save(file);
			this.botAI.trainModelWithMultiDataSet(this.dataSets);
			this.botAI.saveModel();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void trainAI() {
		if (this.botAI == null) {
			return ;
		}
		ArrayList<Double> visionField = this.botAI.getVisionField(this);
		this.dataSets.add(this.botAI.generateNormalizedDataSet(visionField, this, this.currentAction));
	}
	
	public void die(Bomb bomb)
	{
		if (this.bot != null) {
			this.alive = false;
			if (this.bot.isAlive()) {
				this.bot.die();
			}
			return ;
		}
		this.respawn();
	}

	public void stopScheduler() {
		if (movescheduler != null && !movescheduler.isShutdown()) {
			movescheduler.shutdown();
		}
	}

	public void respawn() {
		Case c = World.map.getNextRandomStartCell();
		this.x = (c.getx() * 32) - 5;
		this.y = (c.gety() * 32) + 10;
		this.olddir = 0;
		if (this.bot == null) { // update player to new pos
			this.sendUpdate();
		}
	}

	public void sendUpdate() {
		for (Client c : Start.webServer.getClients()) {
			if (c != null) {
				SocketSender.sendMessage(c, Formatter.formatUpdatePlayerMessage(this));
			}
		}
	}

	@Override
	public void run() {
		try {
			move();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
