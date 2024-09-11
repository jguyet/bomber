package org.web.bot;

import org.web.Start;
import org.web.client.Client;
import org.web.client.message.SocketSender;
import org.web.entity.Player;
import org.web.enums.BinaryDirection;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.Formulas;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Bot implements Runnable {

    private final Player player;
    private final ScheduledExecutorService moveScheduler = Executors.newScheduledThreadPool(1);
    private boolean inAction = false;
    private Case lastCell;
    private int stepsSinceLastBomb = 0;  // Compteur de pas avant de poser une bombe
    private int stepsOnSameCell = 0;

    public Bot() {
        Case walkable = World.map.getRandomWalkableCellStart();
        this.player = new Player(World.getnextPlayerId(), (walkable.getx() * 32) - 5, (walkable.gety() * 32) + 10, Formulas.getRandomValue(2, 3), null, this);
        this.lastCell = walkable;
        moveScheduler.scheduleAtFixedRate(this, 1000 / 3, 1000 / 3, TimeUnit.MILLISECONDS);
        log("Bot initialized at: " + walkable.getId());
    }

    public Player getPlayer() {
        return this.player;
    }

    // Gestion des mouvements avec logs pour mieux suivre l'état
    private void moveTo(Case targetCell, BinaryDirection direction) {
        if (targetCell != null && targetCell.isWalkable() && !targetCell.hasBomb()) {
            if (direction == BinaryDirection.right && targetCell.getRightCell() != null && targetCell.getRightCell().hasBomb()) {
                return ;
            }
            if (direction == BinaryDirection.left && targetCell.getLeftCell() != null && targetCell.getLeftCell().hasBomb()) {
                return ;
            }
            if (direction == BinaryDirection.up && targetCell.getTopCell() != null && targetCell.getTopCell().hasBomb()) {
                return ;
            }
            if (direction == BinaryDirection.down && targetCell.getBottomCell() != null && targetCell.getBottomCell().hasBomb()) {
                return ;
            }

            log("Moving to direction: " + direction.name() + " towards cell: " + targetCell.getId());
            this.player.setDirection(direction.getId());
            this.player.setonMove(true);
            this.inAction = true;
            // Envoi d'une mise à jour aux clients
            sendPlayerUpdate();
        } else {
            log("Cannot move to cell " + (targetCell != null ? targetCell.getId() : "null") + ". Either not walkable or contains a bomb.");
        }
    }

    // Action principale du bot
    public void doAction() {
        Case currentCell = this.player.getCurCell();
        if (currentCell == null) {
            log("Current cell is null, stopping bot.");
            return;
        }

        if (stepsOnSameCell > 1000 && this.inAction) {
            this.inAction = false;
            this.player.setonMove(false);
            this.lastCell = currentCell;
        }

        if (this.inAction && this.lastCell.getId() != currentCell.getId()) {
            log("Action complete. Player moved to new cell: " + currentCell.getId());
            this.inAction = false;
            this.player.setonMove(false);
            this.lastCell = currentCell;  // Mettre à jour la dernière case
            stepsSinceLastBomb++;
            stepsOnSameCell = 0;

            // Pose de bombe si le bot a fait plusieurs pas ou si d'autres conditions sont remplies
            if (shouldPlaceBomb(currentCell)) {
                placeBomb(currentCell);
                stepsSinceLastBomb = 0;  // Réinitialiser le compteur de pas après avoir posé une bombe
            }
            // Envoi d'une mise à jour aux clients
            sendPlayerUpdate();
        }

        if (!this.inAction) {
            // Vérification des cellules voisines
            switch (Formulas.getRandomValue(1, 4)) {
                case 1:
                    moveTo(currentCell.getRightCell(), BinaryDirection.right);
                    break ;
                case 2:
                    moveTo(currentCell.getLeftCell(), BinaryDirection.left);
                    break ;
                case 3:
                    moveTo(currentCell.getTopCell(), BinaryDirection.up);
                    break ;
                case 4:
                    moveTo(currentCell.getBottomCell(), BinaryDirection.down);
                    break ;
            }
            if (!this.inAction) moveTo(currentCell.getTopCell(), BinaryDirection.up);
            if (!this.inAction) moveTo(currentCell.getBottomCell(), BinaryDirection.down);
            if (!this.inAction) moveTo(currentCell.getLeftCell(), BinaryDirection.left);
            if (!this.inAction) moveTo(currentCell.getRightCell(), BinaryDirection.right);

            if (!this.inAction) {
                log("No valid moves available from cell: " + currentCell.getId());
            }
        }
        stepsOnSameCell++;
    }

    // Méthode pour déterminer si une bombe doit être posée
    private boolean shouldPlaceBomb(Case currentCell) {
        // Condition de pose de bombe : par exemple, après un certain nombre de pas ou selon une stratégie
        if (stepsSinceLastBomb >= 5) {  // Ex : après 5 pas, poser une bombe
            log("Ready to place a bomb at cell: " + currentCell.getId());
            return true;
        }
        return false;
    }

    // Méthode pour poser une bombe
    private void placeBomb(Case currentCell) {
        if (!currentCell.hasBomb()) {
            log("Placing bomb at cell: " + currentCell.getId());
            World.addBomb(this.player);
        }
    }

    public void stopMove() {
        Case currentCell = this.player.getCurCell();
        this.inAction = false;
        this.player.setonMove(false);
        this.lastCell = currentCell;  // Mettre à jour la dernière case
        stepsSinceLastBomb++;
        stepsOnSameCell = 0;
        if (shouldPlaceBomb(currentCell)) {
            placeBomb(currentCell);
            stepsSinceLastBomb = 0;  // Réinitialiser le compteur de pas après avoir posé une bombe
        }
    }

    // Envoi de l'état du joueur aux clients
    public void sendPlayerUpdate() {
        for (Client c : Start.webServer.getClients()) {
            if (c != null) {
                SocketSender.sendMessage(c, "PM"
                        + player.getId()
                        + "|" + player.getx()
                        + "|" + player.gety()
                        + "|" + player.getClientDirection()
                        + "|" + player.getskin()
                        + "|" + player.getDirection());
            }
        }
    }

    // Ajout de logs pour le débogage
    private void log(String message) {
        System.out.println("[Bot] " + message);
    }

    @Override
    public void run() {
        doAction();
    }
}
