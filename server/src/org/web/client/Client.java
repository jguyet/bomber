package org.web.client;

import java.net.Socket;
import java.util.ArrayList;

import org.web.Console;
import org.web.Console.Color;
import org.web.Start;
import org.web.client.message.SocketSender;
import org.web.entity.Player;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.Formulas;

public class Client{
	
	public Socket								session;
	public Aks									aks;
	public Player								player;
	public ArrayList<String>                    queueOfMessages = new ArrayList<>();

	public Client(Socket session)
	{
		System.out.println("NEW CLIENT");
		this.session = session;
		Case walkable = World.map.getNextRandomStartCell();
		this.player = new Player(World.getnextPlayerId(), (walkable.getx() * 32) + (32 / 2), (walkable.gety() * 32) + (32 / 2), 1, this, null);
		this.aks = new Aks(this);
	}
	
	public void kick()
	{
		try
		{
			ArrayList<Client> clients = Start.webServer.getClients();
			for (Client c : clients)
			{
				if (c == this)
					continue ;
				SocketSender.sendMessage(c, "PD" + player.getId());
			}
			Start.webServer.removeClient(this);
			if(!session.isClosed())
			{
				SocketSender.sendMessage(this, "GK");
	    		session.close();
			}
	    	this.aks.closeDescriptors();
			if (this.player != null) {
				this.player.die(null);
				this.player.stopScheduler();
				this.player = null;
				this.aks = null;
			}
	    	Console.println("Client disconnected ", Color.BLACK);
		}
		catch (Exception e1)
		{
			e1.printStackTrace();
		}
	}
}
