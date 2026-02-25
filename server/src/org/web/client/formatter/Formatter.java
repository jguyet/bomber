package org.web.client.formatter;

import org.web.entity.Player;

public class Formatter {

    public static String formatAddPlayerMessage(Player player, boolean isCurrent) {
            return "PA"
                    + player.getId()
                    + "|" + player.getx()
                    + "|" + player.gety()
                    + "|" + player.getClientDirection()
                    + "|" + player.getskin()
                    + "|" + player.getSpeed()
                    + "|" + (isCurrent ? "1" : "0");
    }

    public static String formatUpdatePlayerMessage(Player player) {
        return "PM"
                + player.getId()
                + "|" + player.getx()
                + "|" + player.gety()
                + "|" + player.getClientDirection()
                + "|" + player.getskin()
                + "|" + player.getDirection()
                + "|" + player.getMove()
                + "|" + System.currentTimeMillis();
    }

    public static String formatDeletePlayerMessage(Player player) {
        return "PD" + player.getId();
    }
}
