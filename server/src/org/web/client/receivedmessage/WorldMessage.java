package org.web.client.receivedmessage;

import java.util.ArrayList;

import org.web.Start;
import org.web.bot.Bot;
import org.web.client.Client;
import org.web.client.message.SocketSender;
import org.web.entity.Bomb;
import org.web.entity.Item;
import org.web.game.world.World;

public class WorldMessage {

	public void loadWorld(String message, Client client)
	{
		SocketSender.sendMessage(client, 
				"WL" +  World.map.getwidth()
				+ "|" + World.map.getheight()
				+ "|" + World.map.getData());
	}

	public void loadEntities(String message, Client client) {
		SocketSender.sendMessage(client, "PA"
				+ client.player.getId()
				+ "|" + client.player.getx()
				+ "|" + client.player.gety()
				+ "|" + client.player.getClientDirection()
				+ "|" + client.player.getskin()
				+ "|" + client.player.getSpeed()
				+ "|1");
		for (Bomb b: World.bombs) {
			SocketSender.sendMessage(client, "BA"
					+ b.getId()
					+ "|" + b.getx()
					+ "|" + b.gety()
					+ "|" + b.getrange());
		}
		for (Item item: World.items) {
			SocketSender.sendMessage(client, "IA"
					+ item.getId()
					+ "|" + item.getTemplateId()
					+ "|" + item.getx()
					+ "|" + item.gety());
		}
		for (Bot bot: World.bots) {
			SocketSender.sendMessage(client, "PA"
					+ bot.getPlayer().getId()
					+ "|" + bot.getPlayer().getx()
					+ "|" + bot.getPlayer().gety()
					+ "|" + bot.getPlayer().getClientDirection()
					+ "|" + bot.getPlayer().getskin()
					+ "|" + bot.getPlayer().getSpeed()
					+ "|0");
		}
		ArrayList<Client> clients = Start.webServer.getClients();
		for (Client c : clients)
		{
			if (c == client)
				continue ;
			SocketSender.sendMessage(c, "PA"
					+ client.player.getId()
					+ "|" + client.player.getx()
					+ "|" + client.player.gety()
					+ "|" + client.player.getClientDirection()
					+ "|" + client.player.getskin()
					+ "|" + client.player.getSpeed()
					+ "|0");
			SocketSender.sendMessage(client, "PA"
					+ c.player.getId()
					+ "|" + c.player.getx()
					+ "|" + c.player.gety()
					+ "|" + c.player.getClientDirection()
					+ "|" + c.player.getskin()
					+ "|" + c.player.getSpeed()
					+ "|0");
		}
	}
}
