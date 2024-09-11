package org.web;


import org.web.bot.Bot;
import org.web.game.world.World;
import org.web.server.WebServer;

import ch.qos.logback.classic.Level;

public class Start {

	public static int				port = 9998;
	public static boolean			isRunning = true;
	public static WebServer			webServer;
	
	public static void main(String ...args)
	{
		//Charge la console
		Console.initialize();
		Console.refreshTitle();
		Console.begin();
		
		World.loadWorld();
		for (int i = 0; i < 10; i++) {
			World.addBot(new Bot());
		}

		//Charge le serveur Web
		webServer = new WebServer();
		webServer.initialize();
	}
}
