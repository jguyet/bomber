package org.web.client.receivedmessage;

import java.util.ArrayList;

import org.web.Start;
import org.web.bot.Bot;
import org.web.client.Client;
import org.web.client.formatter.Formatter;
import org.web.client.message.SocketSender;
import org.web.entity.Bomb;
import org.web.entity.Item;
import org.web.game.world.World;

public class WorldMessage {

	public void loadWorld(String message, Client client) {
		SocketSender.sendMessage(client, 
				"WL" +  World.map.getwidth()
				+ "|" + World.map.getheight()
				+ "|" + World.map.getData());
	}

	public void loadEntities(String message, Client client) {
		SocketSender.sendMessage(client, Formatter.formatAddPlayerMessage(client.player, true));
		for (Bomb b: World.bombs) {
			if (b == null) return ;
			SocketSender.sendMessage(client, "BA"
					+ b.getId()
					+ "|" + b.getx()
					+ "|" + b.gety()
					+ "|" + b.getrange());
		}
		for (Item item: World.items) {
			if (item == null) return ;
			SocketSender.sendMessage(client, "IA"
					+ item.getId()
					+ "|" + item.getTemplateId()
					+ "|" + item.getx()
					+ "|" + item.gety());
		}
		for (Bot bot: World.bots) {
			if (bot == null) return ;
			SocketSender.sendMessage(client, Formatter.formatAddPlayerMessage(bot.getPlayer(), false));
		}
		ArrayList<Client> clients = Start.webServer.getClients();
		for (Client c : clients) {
			if (c == client)
				continue ;
			SocketSender.sendMessage(c, Formatter.formatAddPlayerMessage(client.player, false));
			SocketSender.sendMessage(client, Formatter.formatAddPlayerMessage(c.player, false));
		}
	}
}
