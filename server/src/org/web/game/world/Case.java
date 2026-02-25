package org.web.game.world;

import java.util.ArrayList;

import org.web.Start;
import org.web.client.Client;
import org.web.client.message.SocketSender;
import org.web.entity.Bomb;
import org.web.entity.Item;
import org.web.entity.Player;

public class Case {

	private int			id;
	private boolean		walkable;
	private int			ground;
	private double		x;
	private double		y;
	private Bomb		bomb = null;
	private Item 		item = null;
	
	public Case(int id, boolean walkable, int ground, double x, double y)
	{
		this.id = id;
		this.walkable = walkable;
		this.ground = ground;
		this.x = x;
		this.y = y;
	}
	
	public int getId()
	{
		return (id);
	}
	
	public boolean isWalkable()
	{
		return (this.walkable);
	}
	
	public boolean isWalkableCheckBomb(Player p)
	{
		if (this.hasBomb()
			&& this.bomb.getLauncher().getId() != p.getId())
			return (false);
		else if (this.hasBomb()
				&& p.getCurCell().getId() != this.id)
			return (false);
		else if (this.hasBomb() && p.getCurCell().getId() == this.getId())
			return (true);
		return (this.walkable);
	}
	
	public void setWalkable(boolean walk)
	{
		this.walkable = walk;
	}
	
	public int getGroundId()
	{
		return (this.ground);
	}
	
	public void setGround(int id)
	{
		this.ground = id;
	}

	public boolean isDestructible() {
		return this.ground == 104;
	}
	
	public void sendCell()
	{
		for (Client c : Start.webServer.getClients())
		{
			SocketSender.sendMessage(c, "WC" + this.ground + "|" + x + "|" + y + "|" + (this.walkable ? "1" : "0"));
		}
	}
	
	public double getx()
	{
		return (x);
	}
	
	public double gety()
	{
		return (y);
	}
	
	public void addBomb(Bomb b)
	{
		this.bomb = b;
	}
	
	public boolean hasBomb()
	{
		return (this.bomb != null);
	}
	
	public Bomb getBomb()
	{
		return (this.bomb);
	}

	public void addItem(Item item) {
		this.item = item;
	}

	public boolean hasItem() {
		return (this.item != null);
	}

	public Item getItem() {
		return (this.item);
	}

	public Case getLeftCell() {
		return World.map.getCell(this.getx() - 1, this.gety());
	}

	public Case getRightCell() {
		return World.map.getCell(this.getx() + 1, this.gety());
	}

	public Case getTopCell() {
		return World.map.getCell(this.getx(), this.gety() - 1);
	}

	public Case getBottomCell() {
		return World.map.getCell(this.getx(), this.gety() + 1);
	}

}
