BackgroundApp.addModule({beforeStart: function(app) { 

	app.defaultSave = 
{"tiles":["grass","deep_default","hole1","dirty","grass2","grass3","field","abyss","deep_bridge","dirty_hole","hole2","hole3","hole4","rocky","rocky_hole","tile1","tile2","bridge_h","bridge_v","bridge_metal_v","bridge_metal_h","tile4","tile3","left","up","right","down","brick","chest_in_rock","rock3","rock2","rock1","rock0","silver3","silver2","silver1","silver0","gold3","gold2","gold1","gold0","diamond3","diamond2","diamond1","diamond0","tough2","tough9","tough1","tough8","tough7","tough6","tough5","tough4","tough3","wall6","wall5","wall4","wall3","wall2","wall1","chest","metal","tunnel","tunnel_tile","gold_chest","gold_chest_tile","metal_chest","metal_chest_tile","box1","box2","box_with_bombs","box_with_bombs_tile","goal","wc","bush","bush_hollow","gate_closed","gate_opened","button_off","button_on","button_fake","button2_off","button2_on","bridge_off","bridge_on","diamond_chest","holygrass","holytile"],"field":[[37,35,36,36,35,3,3,31,29,31,32,27,27,27,31,31,29,3,46,0,49,5,0,32,37,30,31,3,27,27,27,0,46,27,46,0,46,27,46,31,29,3,31,3,3,14,4,27,46,13,13,82,13,13,46,27,4,27,27,27,27,0,27,5,36,32,32,0,46,0,36,35],[35,3,36,32,3,3,3,3,31,32,46,0,46,27,46,32,31,32,3,27,5,5,3,32,35,32,32,48,27,27,48,0,27,27,0,27,5,46,27,27,32,32,32,3,46,0,48,0,13,13,74,24,74,13,13,27,50,27,46,27,46,0,46,13,27,46,27,27,27,27,27,36],[49,9,48,32,31,3,3,2,0,48,27,27,27,0,27,27,3,27,6,6,6,6,6,3,46,32,0,0,0,5,0,2,6,46,6,6,6,27,46,27,0,13,32,27,0,4,13,4,13,74,77,13,77,74,13,27,27,27,27,27,27,27,27,13,46,27,46,0,46,27,46,0],[0,0,4,5,3,3,2,3,32,4,48,27,46,27,46,27,9,0,6,6,6,6,6,14,0,0,46,0,48,0,0,0,6,6,6,6,6,0,27,27,51,4,46,27,46,0,45,13,81,23,14,7,13,25,81,53,0,0,46,0,46,0,51,0,27,27,27,27,27,46,0,4],[48,4,48,0,3,2,0,2,3,5,2,5,27,27,27,27,48,27,6,51,72,6,6,0,27,27,27,5,0,4,0,0,6,6,72,6,6,5,46,27,0,0,13,27,27,27,4,0,13,74,77,74,77,61,46,27,27,27,27,27,27,27,0,0,46,0,46,27,32,0,46,27],[27,13,0,50,2,14,2,0,46,0,48,27,46,27,46,27,3,49,6,6,6,6,6,13,27,46,46,27,46,13,0,13,6,6,6,46,6,27,27,0,45,5,48,27,46,27,48,0,13,13,13,74,13,13,74,27,46,27,46,27,46,27,50,0,27,13,0,27,27,27,27,27],[49,4,48,27,51,2,0,0,0,0,0,13,27,27,27,0,9,0,6,6,6,49,6,0,32,27,0,27,0,13,4,13,6,6,6,6,6,5,46,27,13,0,2,4,27,27,27,51,13,74,13,61,13,4,61,0,27,0,27,27,0,27,0,2,49,5,0,27,46,0,46,27],[0,5,0,0,13,0,2,50,48,2,49,0,50,0,48,4,3,3,0,0,0,46,5,4,46,27,46,27,49,4,10,10,27,27,0,46,13,27,27,27,0,0,2,5,46,27,52,0,36,3,13,27,74,61,13,0,46,0,46,0,46,27,47,0,0,2,0,13,5,0,27,27],[27,46,27,0,13,0,0,48,13,0,2,0,0,0,13,5,32,32,32,46,0,46,0,27,27,27,27,27,13,0,50,4,27,46,46,46,27,46,27,46,4,5,13,13,46,0,27,3,3,27,0,52,0,50,27,46,51,0,48,27,5,49,0,0,14,0,2,53,0,49,13,48],[0,27,0,0,13,7,0,0,13,52,0,51,0,49,4,48,27,27,27,27,27,27,27,27,0,48,27,46,0,48,27,49,27,27,27,27,27,27,27,27,13,4,0,48,0,49,0,0,4,0,5,0,0,0,0,27,13,51,0,49,5,46,0,52,2,2,0,4,2,5,0,13],[46,0,0,7,18,7,7,0,0,0,0,0,4,13,0,0,0,46,27,46,27,46,0,46,27,27,27,27,27,27,0,27,27,46,0,46,27,46,27,46,13,4,4,0,13,13,4,0,13,27,27,50,0,48,27,48,2,5,13,0,0,13,50,5,2,45,0,48,14,48,0,46],[0,7,7,7,18,7,7,7,4,13,0,48,0,13,27,50,27,27,0,27,0,27,27,0,0,46,27,46,27,46,27,46,27,27,27,0,27,27,27,27,27,48,0,48,0,46,0,46,0,4,0,0,14,0,0,27,5,46,5,0,2,48,0,51,0,0,0,13,13,13,0,27],[7,7,7,7,18,7,0,0,2,5,47,27,0,0,27,27,46,46,27,46,27,46,27,46,46,27,27,0,27,27,27,5,0,46,27,46,27,46,27,46,27,70,0,0,5,0,0,0,0,48,27,50,0,50,27,46,27,27,27,5,0,4,2,5,13,0,5,46,4,46,4,52],[0,0,17,17,13,0,0,27,10,4,2,50,13,0,27,48,27,0,0,27,27,0,27,27,0,46,27,46,27,46,27,48,27,27,27,27,0,27,27,27,27,46,4,46,5,0,0,50,0,27,13,0,2,0,5,0,27,46,27,48,13,49,2,13,13,13,13,5,0,45,2,2],[0,7,7,7,13,0,27,46,2,2,14,13,5,0,52,5,0,46,27,46,27,46,0,46,27,27,27,27,46,27,27,0,0,46,0,46,27,46,27,46,27,73,46,4,5,0,2,0,0,48,27,27,0,46,27,27,46,46,27,27,0,0,5,0,2,50,0,46,0,46,4,5],[7,7,0,0,13,0,27,27,5,47,0,53,5,45,4,0,27,27,27,27,27,27,0,27,27,46,27,48,27,13,27,50,27,27,27,27,27,27,27,27,27,48,27,46,4,48,0,50,0,27,27,27,0,27,0,27,27,0,27,0,5,45,4,12,14,0,0,5,0,4,0,10],[48,27,46,27,46,27,46,27,2,4,10,0,0,5,0,13,0,5,46,27,46,27,52,2,13,0,0,0,13,0,4,0,5,5,49,5,49,0,49,0,0,27,0,27,27,27,27,27,51,5,49,4,53,27,27,27,27,0,48,13,5,0,5,2,0,5,0,0,50,27,48,13],[0,0,0,27,0,27,27,27,53,13,53,13,49,13,46,27,48,5,27,27,27,13,27,13,52,2,49,0,46,4,51,0,0,4,2,5,0,2,0,4,0,13,46,27,46,27,46,27,27,27,27,27,27,27,27,46,46,27,27,27,0,52,10,2,10,5,52,27,27,51,5,10],[48,27,46,0,46,27,46,27,2,13,0,2,13,0,4,27,48,2,48,27,13,0,48,5,0,4,0,4,0,14,0,0,53,27,48,0,49,4,0,2,5,27,27,27,0,27,27,0,46,27,46,27,46,27,27,27,27,27,0,48,5,0,5,13,5,2,50,5,46,13,49,0],[0,0,27,46,27,27,27,0,48,0,50,0,49,0,27,27,27,51,27,27,27,5,5,0,0,0,53,5,49,0,46,0,0,27,27,0,13,13,4,5,46,0,50,0,46,27,46,27,27,27,0,27,27,0,0,27,0,49,27,6,6,45,6,6,11,0,2,14,0,13,0,2],[48,27,46,0,27,46,46,27,5,13,5,14,2,2,5,4,49,0,49,27,46,0,46,0,4,45,5,2,0,5,13,0,48,27,46,0,5,4,45,2,13,0,2,0,0,0,27,27,46,0,46,27,27,27,46,0,5,27,4,6,6,6,6,6,13,53,2,4,48,4,51,5],[0,27,27,0,0,27,27,46,46,4,46,0,49,0,46,13,5,0,5,4,27,49,0,0,0,0,5,10,14,2,48,4,0,27,27,50,0,0,4,4,51,5,50,0,46,13,46,27,27,46,27,27,27,27,27,0,51,4,48,6,6,72,13,6,0,0,0,2,5,0,14,14],[46,27,46,27,46,27,46,0,3,3,3,4,13,2,53,0,0,4,4,50,49,27,49,2,0,2,2,0,73,5,13,0,45,27,49,27,48,13,45,0,0,4,0,2,0,5,0,27,49,27,48,27,48,27,48,13,0,2,2,6,6,6,6,6,2,13,51,4,4,0,49,13],[0,0,5,4,0,27,32,32,32,31,31,3,53,0,48,0,2,10,5,14,2,52,0,2,0,0,47,0,52,13,48,0,2,0,2,4,5,13,0,49,5,0,53,5,46,4,46,0,0,27,0,27,0,46,4,0,2,0,47,6,6,6,6,6,4,14,5,52,0,13,0,10],[27,46,27,46,27,46,32,31,29,30,3,3,3,0,0,5,0,0,51,27,27,27,0,51,0,13,2,0,49,4,4,0,4,4,5,0,13,50,27,48,7,0,0,7,0,0,27,27,3,3,3,3,3,5,9,14,13,13,0,27,5,0,48,0,0,49,27,46,5,49,0,53],[27,0,27,27,27,46,27,32,31,31,32,46,13,50,4,50,0,27,27,70,0,0,0,2,14,6,6,6,6,6,0,51,2,0,2,0,13,27,27,27,7,7,0,7,7,0,27,46,3,3,3,0,3,9,3,0,27,46,27,46,0,46,27,50,13,0,0,0,0,4,0,13],[0,46,27,46,27,46,27,46,32,27,51,4,2,0,10,5,0,49,27,46,27,46,0,49,53,6,6,6,6,6,0,5,2,0,5,49,0,46,27,46,0,7,18,7,7,0,0,27,3,3,3,5,2,13,3,0,0,27,27,27,0,0,5,0,0,49,27,46,27,46,27,49],[27,27,0,27,27,27,27,27,27,46,4,48,0,46,4,49,0,27,13,27,27,0,0,5,0,6,6,72,0,6,0,50,4,4,0,0,0,27,4,0,0,7,18,7,7,7,0,0,3,3,9,9,9,3,3,3,0,46,0,46,27,46,5,0,0,27,0,0,27,0,0,13],[27,46,27,46,36,46,27,46,13,13,4,0,0,0,45,13,27,48,2,48,27,46,27,48,3,6,6,6,6,6,2,5,0,47,4,50,2,48,13,53,13,13,13,17,17,17,13,13,9,47,3,0,5,5,9,0,46,27,27,27,27,27,27,0,5,49,27,46,3,48,0,49],[27,27,27,27,27,27,27,27,5,46,13,48,0,46,13,50,27,27,0,27,27,27,27,5,3,6,0,6,6,6,4,45,13,0,2,2,2,0,14,5,0,0,0,7,7,7,7,0,9,3,9,3,3,3,0,9,13,46,5,46,27,46,27,46,4,0,27,0,0,0,2,2],[13,46,27,46,32,46,27,46,10,4,2,4,4,13,2,2,0,46,0,46,27,27,3,3,3,9,3,10,3,4,0,2,0,5,0,50,4,52,5,50,0,27,0,0,7,7,0,0,9,0,3,4,3,0,5,52,4,0,2,4,46,27,27,27,5,47,0,45,0,48,0,51],[2,3,0,27,27,27,27,27,0,48,0,51,5,52,0,13,27,27,46,27,27,27,36,31,3,3,3,45,27,52,0,51,5,5,0,5,0,10,13,0,5,46,27,0,7,0,0,27,3,3,9,3,3,0,0,4,2,52,4,46,27,48,27,48,0,14,0,10,2,0,0,5],[3,40,40,0,13,0,0,0,5,0,0,4,5,13,0,2,52,0,27,0,48,48,3,3,3,9,5,0,5,2,3,13,2,0,48,27,50,0,13,4,5,0,13,13,4,0,0,5,49,27,27,27,46,27,46,27,50,0,0,0,4,0,0,14,13,2,53,2,2,13,0,3],[40,40,0,0,13,7,7,0,48,4,48,13,52,0,46,0,27,46,27,45,0,27,3,3,3,9,3,5,47,2,0,13,0,13,0,0,5,0,0,0,50,27,50,0,46,0,53,0,0,0,0,0,0,0,27,27,49,0,48,27,50,2,2,2,50,0,0,0,0,0,4,0],[0,0,0,7,18,7,7,7,27,13,0,27,27,0,27,4,48,0,49,2,50,0,3,3,3,9,9,13,0,2,0,0,48,27,46,27,27,0,48,4,13,0,5,10,4,2,5,11,48,27,46,27,46,0,46,27,0,0,5,5,0,13,52,0,48,0,51,2,51,27,48,5],[0,0,7,7,18,7,7,0,46,13,46,27,46,0,48,0,0,13,5,0,0,51,0,3,3,9,2,4,45,5,53,0,27,27,27,46,27,4,27,27,51,27,48,0,53,2,0,2,0,46,27,27,27,27,0,27,50,0,0,27,46,5,49,2,0,2,0,2,13,0,4,27],[0,0,7,7,18,7,0,0,13,4,5,5,0,27,27,13,52,0,49,2,0,4,51,3,3,3,0,4,5,4,0,0,0,13,50,4,46,27,49,4,2,0,5,10,0,2,0,5,48,27,46,27,46,0,46,27,4,0,4,13,0,27,0,2,48,13,48,0,46,27,46,27],[0,7,7,7,18,0,0,4,49,0,0,0,46,27,46,0,0,2,0,13,2,14,2,9,3,9,47,2,0,0,0,14,4,0,2,0,4,13,0,49,52,13,48,4,50,0,53,14,0,27,0,0,27,46,27,0,51,2,48,27,46,27,49,5,13,2,0,45,27,27,27,27],[7,7,7,7,13,0,48,13,0,0,13,0,0,0,27,5,0,0,50,0,13,0,45,9,9,3,4,5,4,10,0,14,50,73,0,5,48,27,51,0,3,0,0,10,2,2,5,0,48,27,46,27,46,27,46,27,5,0,5,0,27,27,27,0,45,2,0,0,49,27,48,27],[7,7,0,0,13,27,0,0,47,13,46,4,48,0,46,5,0,0,13,2,0,5,5,3,3,4,0,5,0,2,4,11,4,13,0,13,5,13,0,9,3,3,0,2,47,0,50,4,0,27,27,27,27,27,0,27,52,2,49,27,46,27,53,10,0,2,13,0,0,0,0,49],[27,46,4,46,27,46,27,0,0,4,52,0,0,0,0,0,6,6,6,6,6,49,0,52,3,3,0,0,0,27,48,4,61,57,5,58,55,54,61,3,9,3,0,0,0,53,4,0,2,51,0,6,6,51,6,6,27,27,27,27,46,27,27,27,0,4,5,48,27,46,27,46],[27,0,0,0,5,27,27,48,0,49,0,49,0,51,4,4,6,6,6,6,6,13,13,2,3,49,2,48,27,46,27,49,54,15,16,16,15,15,57,0,9,3,0,51,27,48,0,4,0,0,4,6,6,6,52,6,27,46,27,46,27,46,27,46,27,13,0,0,0,0,27,0],[27,46,0,0,27,27,27,46,0,5,4,2,10,4,52,0,6,6,72,6,6,51,0,48,27,0,2,0,46,27,27,27,55,15,16,16,16,16,58,4,2,2,49,27,5,0,5,14,10,0,5,6,6,72,6,6,46,27,0,27,0,27,27,27,13,48,0,46,0,46,0,46],[0,27,27,0,27,4,0,13,10,45,4,50,0,0,2,47,6,6,6,53,6,2,0,13,32,46,5,46,0,48,27,46,56,15,22,61,16,15,58,27,0,50,27,48,4,51,13,52,13,5,13,6,6,6,6,6,0,46,27,46,27,46,27,27,27,27,27,27,27,27,27,27],[27,46,27,46,27,46,27,46,3,2,0,0,2,0,13,2,6,6,45,6,6,48,0,46,0,27,32,36,4,2,0,27,58,15,22,16,22,16,58,49,2,0,0,0,5,2,51,0,0,46,0,6,6,6,6,6,27,0,27,27,46,27,27,27,0,46,27,46,27,27,27,46],[27,0,27,27,27,27,27,0,2,52,0,48,4,50,0,13,10,0,5,5,0,0,4,13,3,27,32,46,27,48,27,46,58,15,15,15,16,15,58,0,5,50,0,51,2,52,27,50,0,5,27,13,0,0,5,0,27,46,27,46,27,46,27,46,27,27,0,27,0,27,27,27],[0,46,0,46,0,48,27,48,4,5,2,5,14,13,13,0,0,0,5,49,5,46,27,48,27,32,32,27,27,0,27,27,61,55,0,59,58,59,61,49,5,4,14,0,2,13,0,0,49,46,27,50,4,53,0,51,0,0,27,27,27,27,27,0,27,46,27,46,27,46,27,27],[0,27,27,0,4,2,0,0,0,49,0,48,13,46,52,0,0,9,0,5,27,27,32,3,32,31,32,46,0,46,27,27,0,4,4,2,0,10,4,13,0,2,4,10,2,0,52,13,4,4,0,0,2,0,0,13,27,46,27,46,27,46,27,46,27,27,27,27,27,27,27,27],[48,27,46,4,46,0,50,0,4,27,27,27,27,0,5,0,13,2,3,0,46,27,32,3,30,32,31,36,27,27,27,49,5,0,49,0,46,5,48,0,10,0,13,13,45,0,0,2,9,53,52,2,4,5,5,2,47,27,27,27,27,27,5,27,51,27,0,27,46,0,0,27],[27,27,5,5,0,4,2,13,0,27,46,27,46,27,27,27,0,2,48,0,27,46,27,3,3,3,3,3,46,32,0,5,0,48,27,48,0,27,27,27,13,0,48,5,5,5,0,0,9,0,5,2,13,2,2,2,52,27,46,27,46,27,46,27,27,27,27,27,27,27,27,27],[46,27,46,0,46,4,48,0,27,27,27,70,27,27,27,46,0,5,48,27,46,5,52,2,0,3,9,3,3,0,32,4,27,27,46,0,46,27,46,13,0,13,0,0,0,27,5,0,51,27,49,4,51,13,51,5,27,13,0,27,46,27,27,70,46,27,46,27,46,0,46,0],[27,27,27,27,27,0,0,0,46,27,46,27,46,27,46,27,0,5,0,0,0,14,0,13,52,10,51,36,32,32,46,0,46,27,27,0,27,27,27,46,50,0,46,0,46,27,46,27,32,32,0,13,4,51,0,2,50,5,45,0,46,27,46,27,27,27,27,49,27,27,27,27],[27,27,46,27,46,27,50,10,0,0,0,27,27,27,0,27,50,13,49,27,32,3,3,5,4,2,5,3,32,32,0,5,27,0,46,27,46,27,46,0,2,13,5,0,40,0,27,27,32,32,32,13,46,5,52,2,4,4,2,45,27,0,27,27,46,27,46,0,46,27,46,27],[0,46,27,0,27,27,13,2,48,0,46,27,46,27,46,27,13,0,13,27,27,27,0,0,0,0,49,27,46,27,52,14,27,27,27,27,27,27,27,27,49,0,48,0,36,32,46,32,32,32,32,13,0,0,4,0,45,0,0,4,0,49,46,27,5,0,0,14,0,5,27,49],[50,27,46,27,46,27,4,0,0,27,27,27,0,27,27,27,51,0,5,27,46,0,46,49,0,0,4,0,70,0,0,5,46,27,46,0,46,27,46,13,13,2,0,2,4,0,32,32,48,32,32,9,52,13,9,3,3,0,0,5,4,0,4,49,46,27,51,13,50,0,51,0],[0,5,4,0,13,48,0,0,0,4,46,27,46,27,46,0,10,5,2,49,27,27,27,27,32,50,46,27,46,27,50,0,27,46,0,0,27,27,27,0,31,3,3,0,46,27,46,4,3,3,3,3,3,3,9,3,9,14,10,10,0,2,51,0,4,53,2,10,0,0,2,2],[4,46,0,46,27,46,32,3,29,3,0,27,48,0,45,2,0,2,0,51,27,46,46,27,32,27,27,0,46,27,0,0,2,49,4,51,5,50,0,3,31,9,32,4,27,0,0,3,32,32,27,3,32,3,3,3,3,3,0,27,27,5,46,27,27,27,27,48,27,27,27,46],[0,27,0,27,27,70,70,27,30,32,0,46,27,52,0,4,5,0,4,4,49,27,27,0,46,46,27,46,27,46,0,49,5,7,7,7,24,7,13,3,30,3,3,46,48,48,5,0,0,46,32,32,31,32,3,3,35,32,0,48,27,27,0,27,46,27,0,27,0,0,0,27],[0,49,2,48,0,46,0,46,31,3,0,0,0,13,5,0,13,0,0,50,54,46,32,36,40,0,0,27,27,27,27,27,7,7,61,61,15,7,7,3,31,3,3,13,0,0,49,0,0,27,27,46,32,32,31,35,39,36,0,0,46,46,27,27,0,27,46,46,27,46,0,46],[0,0,2,0,2,0,2,0,3,49,0,48,27,46,0,49,0,0,52,54,27,54,46,27,40,46,27,46,27,46,5,46,7,61,16,15,15,61,7,27,13,48,4,48,0,46,5,48,13,27,27,32,31,31,35,36,40,49,10,2,0,48,27,46,27,27,0,27,0,13,0,4],[5,48,2,48,0,46,0,46,49,4,0,5,13,4,0,0,14,49,54,27,60,27,54,48,44,36,0,27,27,13,2,0,7,61,16,65,15,61,7,5,5,4,0,0,0,50,0,0,2,48,48,27,31,31,35,36,44,0,0,4,46,0,27,27,0,46,4,46,5,4,13,48],[2,5,2,4,4,0,13,0,49,49,0,5,27,48,13,2,0,0,46,54,27,54,46,27,27,46,27,46,27,46,0,46,23,15,15,15,15,63,20,4,0,46,5,46,0,48,4,51,0,0,2,0,32,32,32,36,40,36,4,48,27,46,27,46,27,5,2,0,5,13,2,0],[0,48,13,46,27,0,0,27,0,13,2,0,48,4,5,4,14,0,4,52,54,46,27,46,27,27,48,13,27,5,0,0,7,7,63,61,61,7,7,14,51,5,14,0,2,4,10,13,10,51,0,27,27,27,32,3,40,40,0,46,36,27,27,27,0,27,4,46,4,5,0,49],[2,13,4,27,27,27,0,0,0,50,0,49,0,49,27,53,10,2,0,2,49,27,27,27,46,49,0,0,4,48,3,36,3,7,19,7,7,7,13,4,5,53,5,45,0,51,13,47,5,27,13,46,0,27,3,3,36,36,0,46,0,46,27,46,27,27,0,0,27,0,0,0],[49,0,7,7,7,19,7,48,0,0,0,27,0,27,27,27,14,0,13,0,49,27,46,27,27,0,5,50,0,5,3,36,42,40,46,27,46,27,27,27,0,0,10,5,2,13,2,13,52,27,27,27,27,46,27,3,31,40,9,13,0,0,0,0,46,13,46,27,46,27,0,27],[27,7,7,61,61,63,7,7,0,27,46,27,46,27,48,0,5,10,4,5,0,5,27,27,48,46,48,27,0,14,9,3,38,36,0,27,27,0,27,46,46,0,51,0,50,0,51,0,0,27,27,27,27,46,27,32,31,36,48,27,48,27,46,0,5,0,4,46,27,27,13,27],[46,7,61,16,15,15,61,7,27,27,27,0,27,27,27,0,51,2,49,2,49,0,46,27,27,27,70,3,3,3,3,32,39,32,32,27,46,27,46,27,27,0,27,27,27,0,27,0,46,27,46,27,46,27,46,27,32,27,27,27,0,27,4,0,46,4,46,27,46,27,27,27],[27,7,61,15,65,16,61,7,46,0,46,0,46,27,46,0,5,0,0,0,0,14,4,27,50,27,46,32,32,31,3,32,32,32,27,27,27,0,27,27,48,27,46,27,46,0,46,27,27,27,27,27,27,27,27,0,32,27,46,27,46,73,50,13,27,27,27,27,27,0,0,46],[32,23,15,15,15,16,15,25,0,27,0,27,40,32,27,27,50,0,49,13,48,0,46,27,27,27,27,3,31,31,3,3,30,32,46,27,46,27,46,27,32,0,27,27,27,4,27,0,46,27,46,46,0,27,27,27,32,27,27,0,27,27,0,0,46,27,46,27,46,27,46,27],[32,7,7,61,61,63,7,7,46,27,46,27,27,32,46,27,0,13,0,50,0,2,0,5,46,0,49,9,3,3,32,3,32,46,27,27,27,27,27,32,3,27,46,27,46,27,27,27,0,27,27,27,27,27,0,27,48,0,46,27,27,0,48,5,27,27,27,27,27,27,0,27],[35,31,7,7,7,19,7,27,32,0,27,27,32,32,27,32,31,3,32,27,46,0,27,13,0,5,4,0,0,3,5,0,46,27,46,27,46,27,46,32,31,32,32,27,27,27,27,27,46,27,46,27,27,27,46,27,27,0,27,27,27,27,27,5,46,0,46,27,46,27,46,32],[39,35,32,32,32,32,32,32,31,32,46,27,46,27,46,32,30,3,32,27,27,27,51,36,36,3,3,0,3,5,53,2,0,27,27,0,27,46,27,32,31,31,31,27,46,5,46,27,27,0,0,46,27,27,27,27,46,27,46,27,27,0,48,0,0,46,27,0,27,27,27,36]]} 
}})