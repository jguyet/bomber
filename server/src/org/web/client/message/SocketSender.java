package org.web.client.message;

import org.web.Console;
import org.web.Console.Color;
import org.web.Start;
import org.web.client.Client;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.stream.Collectors;

public class SocketSender {

	public static ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

	public static void sendMessage(Message message)
	{
		if (message.getClient() == null)
			return ;
		if (message.serialize() == false)
			return ;
		Console.println("[SEND Message] " + message.getMessage(), Color.BLUE);
		try
		{
			byte[] response = message.getClient().aks.getcodec()
					.encode(message.getMessage().getBytes("UTF-8"), 0, true);
			message.getClient().aks.getoutStream()
				.write(response, 0, response.length);
			message.getClient().aks.getoutStream().flush();
		} catch (Exception e)
		{
			e.printStackTrace();
		}
	}
	
	public static void sendMessage(Client client, String message)
	{
		if (client == null)
			return ;
		if (message == null)
			return ;
		if (client.aks.getoutStream() == null)
			return ;
//		Console.println("[SEND Message] " + message, Color.BLUE);
		try
		{
			client.queueOfMessages.add(message);
//			byte[] response = client.aks.getcodec()
//					.encode(message.getBytes("UTF-8"), 0, true);
//			client.aks.getoutStream()
//				.write(response, 0, response.length);
//			client.aks.getoutStream().flush();
		} catch (Exception e)
		{
			e.printStackTrace();
		}
	}

	public static void sendPackets() {
		for (Client client : Start.webServer.getClients()) {
			try
			{
				if (client == null) continue;
				if (client.queueOfMessages.isEmpty()) continue;
				int countMessage = 0;
				int length = 0;
				ArrayList<String> toSend = new ArrayList<>();
				while (!client.queueOfMessages.isEmpty()) {
					String m = client.queueOfMessages.get(0);
					length += m.length();
					toSend.add(m);
					client.queueOfMessages.remove(0);
					countMessage++;
					if (length > 2000) {
						break ;
					}
				}
				String message = toSend.stream().collect(Collectors.joining("^"));
//				Console.println("[SEND Message] " + message, Color.BLUE);
				byte[] response = client.aks.getcodec()
						.encode(message.getBytes("UTF-8"), 0, true);
				client.aks.getoutStream()
						.write(response, 0, response.length);
				client.aks.getoutStream().flush();
			} catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}
}
