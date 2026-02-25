package org.web.game.world;

import java.util.ArrayList;

import org.web.bot.Bot;
import org.web.enums.BinaryDirection;
import org.web.utils.Formulas;

public class Map {

	private int width;
	private int height;
	private String type;
	private static final int SIZE_CASE = 32;
	private ArrayList<Case> cases = new ArrayList<Case>();
	private ArrayList<Case> startCases = new ArrayList<Case>();
	
	public Map(String type, int width, int height)
	{
		this.type = type;
		this.width = width;
		this.height = height;
	}
	
	public int getwidth()
	{
		return (this.width);
	}
	
	public int getheight()
	{
		return (this.height);
	}
	
	public String getData()
	{
		String data = "";
		
		for (Case c : cases)
		{
			data += (data.isEmpty() ? "" : ";") + c.getGroundId();
		}
		return (data);
	}
	
	public void initialize()//|
	{
		this.cases = new ArrayList<Case>();
		this.startCases = new ArrayList<Case>();
		int y = 0;
		int x = 0;
		double cy = 0;
		int i = 0;
		double cx = 0;

		int solidBlock = 0;
		boolean waitBonds = false;
		while (y < height)
		{
			cx = 0;
			x = 0;
			solidBlock = y % 2 == 0 ? 0 : 0;
			waitBonds = y % 2 == 0 ? true : false;
			while (x < width)
			{
				int g = 0;
				boolean walk = true;

				if (!waitBonds && solidBlock < 4 && x % 2 == 0) {
					g = 104;//80;
					walk = false;
					solidBlock++;
				}
				if (waitBonds && solidBlock < 4 && x % 2 == 0) {
					solidBlock++;
				}
				if (solidBlock >= 4) {
					waitBonds = !waitBonds;
					solidBlock = 0;
				}

				if (walk == true) {
//					if (Formulas.getRandomValue(1, 10) <= 7)
//					{
					g = 104;
					walk = false;
//					}
				}
				Case c = new Case(i, walk, g, cx, cy);
				if (x != 0 && y != 0 && x % 6 == 0 && y % 6 == 0) {
					this.startCases.add(c);
				}
				cases.add(c);
				x++;
				i++;
				cx++;
			}
			cy++;
			y++;
		}

		this.build20FreeSpaces();
	}

	public void build20FreeSpaces() {
		ArrayList<Case> lst = new ArrayList<Case>(this.startCases);
//		for (Case c : cases)
//		{
//			if (!have3placesCell(c) && (c.getGroundId() == 104 || c.getGroundId() == 0))
//				lst.add(c);
//		}
		this.startCases = new ArrayList<>();
		for (Case c : lst) {
			for (Case k: this.getVisionField(c, 2)) {
				k.setGround(0);
				k.setWalkable(true);
			}
			this.startCases.add(c);
		}
		System.out.println(this.startCases.size());
	}
	
	public Case getCellPos(double x, double y)
	{
		double[] pos = {Math.floor((Math.floor(x) / 32) % this.width), Math.floor((Math.floor(y) / 32) % this.height)};
		for (Case c : cases)
		{
			if (c.getx() == pos[0] && c.gety() == pos[1])
				return (c);
		}
		return (null);
	}
	
	public Case getCell(double x, double y)
	{
		if (x < 0) {
			x = (this.width) - (-x);
		}
		if (y < 0) {
			y = (this.height) - (-y);
		}
		for (Case c : cases)
		{
			if ((c.getx() % this.width) == (x % this.width) && (c.gety() % this.height) == (y % this.height))
				return (c);
		}
		return (null);
	}
	
	public Case getRandomWalkableCell()
	{
		ArrayList<Case> lst = new ArrayList<Case>();
		for (Case c : cases)
		{
			if (c.isWalkable())
				lst.add(c);
		}
		if (lst.size() == 0)
			return (null);
		return (lst.get(Formulas.getRandomValue(0, lst.size() - 1)));
	}

	public Case getNextRandomStartCell() {
		Case c = this.startCases.get(Formulas.getRandomValue(0, this.startCases.size() - 1));
		this.startCases.remove(c);
		return c;
	}
	
	public int getnbrWalkable(ArrayList<Case> c)
	{
		int nbr = 0;
		for (Case cell : c)
		{
			if (cell.isWalkable())
				nbr++;
			else
				break ;
		}
		return (nbr);
	}
	
	public boolean have3placesCell(Case c)
	{
		if (!c.isWalkable())
			return (false);

		ArrayList<Case> cells = getdircell(c, BinaryDirection.right.getId(), 3);
		int nbr = getnbrWalkable(cells);
		cells = getdircell(c, BinaryDirection.left.getId(), 3);
		nbr += getnbrWalkable(cells);
		cells = getdircell(c, BinaryDirection.down.getId(), 3);
		nbr += getnbrWalkable(cells);
		cells = getdircell(c, BinaryDirection.up.getId(), 3);
		nbr += getnbrWalkable(cells);
		
		if (nbr > 3)
			return (true);
		return (false);
	}
	
	public Case getRandomWalkableCellStart()
	{
		ArrayList<Bot> bots = new ArrayList<>(World.bots);
		for (Case c : this.startCases) {
			boolean free = true;
			for (Bot bot : bots) {
				if (bot != null && bot.getPlayer().getCurCell().getId() == c.getId()) {
					free = false;
				}
			}
			if (free) {
				return c;
			}
		}
		return this.startCases.get(0);
	}
	
	public ArrayList<Case> getdircell(Case cell, int dir, int range)
	{
		ArrayList<Case> lst = new ArrayList<Case>();
		
		if ((dir & 4) != 0)//up
		{
			for (double i = 1.0; i < range; i++)
			{
				Case c = getCell(cell.getx(), cell.gety() - i);
				if (c != null)
					lst.add(c);
			}
		}
		if ((dir & 8) != 0)//right
		{
			for (double i = 1.0; i < range; i++)
			{
				Case c = getCell(cell.getx() + i, cell.gety());
				if (c != null)
					lst.add(c);
			}
		}
		if ((dir & 16) != 0)//down
		{
			for (double i = 1.0; i < range; i++)
			{
				Case c = getCell(cell.getx(), cell.gety() + i);
				if (c != null)
					lst.add(c);
			}
		}
		if ((dir & 32) != 0)//left
		{
			for (double i = 1.0; i < range; i++)
			{
				Case c = getCell(cell.getx() - i, cell.gety());
				if (c != null)
					lst.add(c);
			}
		}
		return (lst);
	}

	public ArrayList<Case> getVisionField(Case startCell, int range) {
		ArrayList<Case> visionField = new ArrayList<>();

		// Coordonnées actuelles du bot
		double x = startCell.getx();
		double y = startCell.gety();

		// Déplacements pour chaque direction (droite, bas, gauche, haut)
		int[][] directions = { {1, 0}, {0, 1}, {-1, 0}, {0, -1} }; // droite, bas, gauche, haut
		int dirIndex = 0;  // Initialement, on commence à aller vers la droite


		Case firstLineCell = startCell;
		for (int i = 0; i < range - 1; i++) {
			firstLineCell = firstLineCell.getTopCell().getLeftCell();
		}

		Case currentCell = firstLineCell;
		for (int completeTurn = 0; completeTurn < (range * 2 - 1); completeTurn++) {
			Case cellOfTheLine = currentCell;
			for (int i = 0; i < (range * 2 - 1); i++) {
				visionField.add(cellOfTheLine);
				cellOfTheLine = cellOfTheLine.getRightCell();
			}
			currentCell = currentCell.getBottomCell();
		}

//		// Boucle pour aller en spirale jusqu'à atteindre la portée souhaitée
//		while (step <= range) {
//			// Pour chaque direction, faire deux déplacements (un cycle complet de droite, bas, gauche, haut)
//			for (int i = 0; i < 2; i++) {
//				for (int j = 0; j < step; j++) {
//					x += directions[dirIndex][0];
//					y += directions[dirIndex][1];
//
//					// Récupérer la case correspondante
//					Case currentCell = getCell(x, y);
//					if (currentCell != null) {
//						visionField.add(currentCell);  // Ajouter la case au champ de vision
//					}
//				}
//				// Changer de direction après avoir effectué 'step' pas dans la direction actuelle
//				dirIndex = (dirIndex + 1) % 4;
//			}
//
//			// Augmenter le nombre de pas à faire avant de changer de direction
//			step++;
//		}

		return visionField;
	}

}
