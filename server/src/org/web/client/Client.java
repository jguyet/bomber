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

	public Client(Socket session)
	{
		System.out.println("NEW CLIENT");
		this.session = session;
		Case walkable = World.map.getRandomWalkableCellStart();
		this.player = new Player(World.getnextPlayerId(), (walkable.getx() * 32) - 5, (walkable.gety() * 32) + 10, 1, this);
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
	    	Console.println("Client disconnected ", Color.BLACK);
		}
		catch (Exception e1)
		{
			e1.printStackTrace();
		}
	}
}
