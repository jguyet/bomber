package org.web.game.world;

import java.util.ArrayList;

import org.web.Console;
import org.web.Start;
import org.web.bot.Bot;
import org.web.client.Client;
import org.web.client.formatter.Formatter;
import org.web.client.message.SocketSender;
import org.web.client.receivedmessage.WorldMessage;
import org.web.entity.Bomb;
import org.web.entity.Item;
import org.web.entity.Player;
import org.web.utils.Formulas;

public class World {
	
	public static Map map = new Map("test", 50, 40);
	public static ArrayList<Bomb> bombs = new ArrayList<Bomb>();
	public static ArrayList<Item> items = new ArrayList<Item>();
	public static ArrayList<Bot> bots = new ArrayList<Bot>();

	private static int nextplayerid = 0;
	private static int nextbombid = 0;
	private static int nextitemid = 0;

	public static void loadWorld()
	{
		nextbombid = 0;
		nextitemid = 0;
		nextplayerid = 0;
		World.bombs = new ArrayList<>();
		World.items = new ArrayList<>();
		World.bots = new ArrayList<>();
		World.map.initialize();
		if (Start.webServer != null) {
			String worldReloadMessage = "WR" +  World.map.getwidth()
					+ "|" + World.map.getheight()
					+ "|" + World.map.getData();

			for (Client client : Start.webServer.getClients()) {
				client.player.respawn();
				SocketSender.sendMessage(client, worldReloadMessage);
			}
		}
	}
	
	public static int getnextPlayerId()
	{
		return (nextplayerid++);
	}
	
	public static int getnextBombId()
	{
		return (nextbombid++);
	}

	public static int getnextItemId()
	{
		return (nextitemid++);
	}
	
	public static boolean addBomb(Player launcher)
	{
		Case data = launcher.getCurCell();
		if (data == null)
			return false;
		if (data.hasBomb())
			return false;
		if (launcher.getBombCounter() >= launcher.getMaxBombs()) {
			return false;
		}
		launcher.setBombCounter(launcher.getBombCounter() + 1);
		Bomb b = new Bomb(getnextBombId(), data.getx() * 32, data.gety() * 32, launcher, 1);
		ArrayList<Client> clients = Start.webServer.getClients();
		for (Client c : clients)
		{
			SocketSender.sendMessage(c, "BA"
					+ b.getId()
					+ "|" + b.getx()
					+ "|" + b.gety()
					+ "|" + b.getrange());
		}
		bombs.add(b);
		return true;
	}

	public static void addItem(Case cell)
	{
		if (cell.hasBomb())
			return ;
		int templateId = -1;
		if (Formulas.getRandomValue(1, 10) > 8) {
			templateId = 0;
		}
		if (Formulas.getRandomValue(1, 10) > 8) {
			templateId = 4;
		}
		if (Formulas.getRandomValue(1, 10) > 8) {
			templateId = 6;
		}
		if (templateId == -1) {
			return ;
		}
		Item item = new Item(getnextItemId(), templateId, cell.getx() * 32, cell.gety() * 32, cell);
		ArrayList<Client> clients = Start.webServer.getClients();
		for (Client c : clients)
		{
			SocketSender.sendMessage(c, "IA"
					+ item.getId()
					+ "|" + item.getTemplateId()
					+ "|" + item.getx()
					+ "|" + item.gety());
		}
		items.add(item);
	}

	public static void addBot(Bot bot) {
		bots.add(bot);
		ArrayList<Client> clients = Start.webServer.getClients();
		for (Client c : clients) {
			SocketSender.sendMessage(c, Formatter.formatAddPlayerMessage(bot.getPlayer(), false));
		}
	}
}
