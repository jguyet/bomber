package org.web.client.receivedmessage;

import java.util.ArrayList;

import org.web.Console;
import org.web.Start;
import org.web.client.Client;
import org.web.client.formatter.Formatter;
import org.web.client.message.SocketSender;
import org.web.enums.BinaryDirection;
import org.web.enums.PlayerDirection;
import org.web.game.world.Case;
import org.web.game.world.World;

public class PlayerMessage {

	public void addPlayer(String message, Client client)
	{
		ArrayList<Client> clients = Start.webServer.getClients();
		
		for (Client c : clients)
		{
			if (c == null)
				continue ;
			if (c == client)
				continue ;
			SocketSender.sendMessage(c, message);
		}
	}

	public void tpPlayer(String message, Client client)
	{
		String[] params = message.substring(2).split(",");
		double x = Double.parseDouble(params[0]);
		double y = Double.parseDouble(params[1]);
		Case target = World.map.getCell(x, y);

		if (target == null) {
			return ;
		}
		client.player.setx((target.getx() * 32) + 16);
		client.player.sety((target.gety() * 32) + 16);
		for (Client c : Start.webServer.getClients()) {
			if (c == null)
				continue ;
			SocketSender.sendMessage(c, Formatter.formatUpdatePlayerMessage(client.player));
		}
	}
	
	public void keyDown(String message, Client client) {
		ArrayList<Client> clients = Start.webServer.getClients();
		String[] params = message.substring(2).split(",");
		int key = Integer.parseInt(params[0]);
		long time = Long.parseLong(params[1]);
		BinaryDirection d = null;
		double speed = 1.5;

		if (key == 32) {
			client.player.addBomb();
			return;
		}
		if (key == 83) {
			client.player.saveModel();
			return;
		}
		if (key == 38 || key == 87) {
			d = BinaryDirection.up;
		}
		if (key == 40 || key == 83) {
			d = BinaryDirection.down;
		}
		if (key == 37 || key == 65) {
			d = BinaryDirection.left;
		}
		if (key == 39 || key == 68) {
			d = BinaryDirection.right;
		}
		if (d == null) {
			return;
		}
//		if ((d.getId() & client.player.getDirection()) != 0) {
//			return;
//		}
		if ((d.getId() & client.player.getDirection()) == 0) {
			client.player.setDirection(client.player.getDirection() | d.getId());
		}
		if (client.player.getDirection() != 0) {
			client.player.setonMove(true);
		}
		for (Client c : clients) {
			if (c == null)
				continue ;
			SocketSender.sendMessage(c, Formatter.formatUpdatePlayerMessage(client.player));
		}
	}
	
	public void keyUp(String message, Client client) {
		ArrayList<Client> clients = Start.webServer.getClients();

		String[] params = message.substring(2).split(",");
		int key = Integer.parseInt(params[0]);
		long time = Long.parseLong(params[1]);
		
		BinaryDirection d = null;
		
		if (key == 38 || key == 87) {
			d = BinaryDirection.up;
		}
		if (key == 40 || key == 83) {
			d = BinaryDirection.down;
		}
		if (key == 37 || key == 65) {
			d = BinaryDirection.left;
		}
		if (key == 39 || key == 68) {
			d = BinaryDirection.right;
		}
		if (d == null)
			return ;
		if ((d.getId() & client.player.getDirection()) != 0)
			client.player.setDirection(client.player.getDirection() - d.getId());
		if (client.player.getDirection() < 0)
			client.player.setDirection(0);
		if (client.player.getDirection() == 0)
			client.player.setonMove(false);
		for (Client c : clients) {
			if (c == null)
				continue ;
			SocketSender.sendMessage(c, Formatter.formatUpdatePlayerMessage(client.player));
		}
	}
}
