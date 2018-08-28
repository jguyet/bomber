package org.web.enums;

public enum PlayerDirection {

	up (0),
	right (1),
	down (2),
	left (3);
	
	private int direction = 0;
	
	public int getId()
	{
		return (direction);
	}
	
	public static PlayerDirection getDirectionById(int id)
	{
		for (PlayerDirection e : PlayerDirection.values())
		{
			if (e.direction == id)
				return (e);
		}
		return (null);
	}
	
	private PlayerDirection(int enums)
	{
		this.direction = enums;
	}
}
