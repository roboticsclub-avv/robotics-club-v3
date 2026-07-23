sql_items = [
    # Motors & Motor Drivers
    ("SERVO MOTOR SG 90 1.8KG", "Motors & Actuators", 15),
    ("GEAR MOTOR 12V 300RPM(Short)", "Motors & Actuators", 10),
    ("ROBO SMART CAR KIT 4 WHEEL", "Mechanical & Structural", 5),
    ("FAN BRUSHLESS FAN 9", "Motors & Actuators", 15),
    ("STEPPER MOTOR DRIVER 8825", "Motors & Actuators", 5),
    ("TB6600 MOTOR DRIVER", "Motors & Actuators", 10),
    ("ARDUINO MOTOR SHIELD L293", "Motors & Actuators", 10),
    ("MOTOR DRIVER L298", "Motors & Actuators", 5),
    ("PCB A4988 MODULE", "Motors & Actuators", 10),

    # Processors & Microcontrollers
    ("ARDUINO UNO R3 (CLONE)", "Microcontrollers", 5),
    ("RASPBERRY PI 4 MODEL B (4GB)", "Microcontrollers", 5),
    ("NODE MCU ESP32 (CP2102)", "Microcontrollers", 5),
    ("FLY PICO RP2040 BOARD", "Microcontrollers", 5),
    ("KIT ARDUINO STARTER", "Microcontrollers", 1),
    ("QUAD COPTER LARK", "Drone Components", 1),
    ("LINE FOLLOWING ROBOT KIT", "Mechanical & Structural", 1),

    # Power & Batteries
    ("LM2596 STEP DOWN MODULE", "Power & Batteries", 10),
    ("RASPBERRY PI ADAPTOR", "Power & Batteries", 1),
    ("PANASONIC BATTERY AA", "Power & Batteries", 10),
    ("9V BATTERY", "Power & Batteries", 10),
    ("11.1V 5200 mAh Battery", "Power & Batteries", 2),
    ("BMS 40A 4S", "Power & Batteries", 3),
    ("IMAX B6 80W Lipo Charger", "Power & Batteries", 1),
    ("5V 3A Power Regulator BEC", "Power & Batteries", 2),

    # Sensors & Cameras
    ("ULTRASONIC MODULE SR04", "Sensors", 5),
    ("IR PROXIMITY SENSOR BOARD", "Sensors", 5),
    ("RASPBERRY PI CAMERA 5MP", "Sensors", 3),
    ("UBLOX NEO 6M GPS", "Sensors", 5),
    ("Optical Flow Sensor 3901U (UART)", "Sensors", 2),
    ("LIDAR Distance Sensor Benewake TF Luna", "Sensors", 2),
    ("Arducam IMX219 8MB Camera Module", "Sensors", 2),
    ("Arducam IMX708 12MB Camera Module", "Sensors", 1),

    # Electronic Components & LEDs
    ("CAPACITOR KIT ASSORTED", "Miscellaneous", 1),
    ("LED 5MM RED", "Displays & LEDs", 20),
    ("LED 5MM GREEN", "Displays & LEDs", 20),
    ("LED 5MM BLUE", "Displays & LEDs", 20),
    ("LED 5MM YELLOW", "Displays & LEDs", 20),
    ("LED 5MM WHITE", "Displays & LEDs", 20),
    ("MICRO SWITCH 6x6x5", "Miscellaneous", 50),
    ("MICRO SWITCH 6x6x7", "Miscellaneous", 50),
    ("MICRO SWITCH 6x6x15", "Miscellaneous", 50),
    ("MICRO SWITCH 12x12x5", "Miscellaneous", 50),
    ("MICRO SWITCH 12x12x7", "Miscellaneous", 50),
    ("MICRO SWITCH 12x12x12", "Miscellaneous", 50),
    ("SLIDE SWITCH SMALL", "Miscellaneous", 25),
    ("BURG STRIP 40x1 FEMALE", "Miscellaneous", 100),
    ("BURG STRIP 40x1 MALE", "Miscellaneous", 100),
    ("RESISTOR STRIP 25W", "Miscellaneous", 1),
    ("5V 1 Channel Relay Module", "Miscellaneous", 4),

    # Wires & Tools
    ("JUMPER WIRE M/M (40 set)", "Miscellaneous", 3),
    ("JUMPER WIRE M/F (40 set)", "Miscellaneous", 3),
    ("JUMPER WIRE F/F (40 set)", "Miscellaneous", 3),
    ("HOOK UP WIRE 80Y", "Miscellaneous", 5),
    ("Silicon Wire Red & Black (4m)", "Miscellaneous", 4),
    ("Silicon Wire Multi Color (25m)", "Miscellaneous", 25),
    ("XT 60 Connector", "Miscellaneous", 10),
    ("WIRE STRIPPER AND CUTTER", "Tools & Equipment", 10),
    ("SOLDERING IRON 25W", "Tools & Equipment", 1),
    ("LEAD/TIN WIRE 50G", "Tools & Equipment", 1),
    ("SOLDERING FLUX 15GM YELLOW", "Tools & Equipment", 1),
    ("DIGITAL MULTIMETER M890", "Tools & Equipment", 1),
    ("PRECISION SCREWDRIVER SET", "Tools & Equipment", 2),
    ("GLUE GUN 60W", "Tools & Equipment", 2),

    # Drone Components
    ("QUAD COPTER FRAME F450 WITH PCB", "Drone Components", 4),
    ("A2212 1000kv Brushless Motor", "Drone Components", 4),
    ("Simcon 30A BLDC ESC Speed Controller", "Drone Components", 8),
    ("3D Printed Landing Gear Skids", "Drone Components", 8),
    ("Flysky FSi6 2.4Ghz Receiver", "Drone Components", 1),
    ("Power Module PM07", "Drone Components", 1),
    ("Buzzer (Pixhawk Compatible)", "Drone Components", 1),
    ("Antivibration Pad", "Drone Components", 2),

    # Accessories & Storage
    ("Aluminium Heatsink Case with Fan", "Miscellaneous", 1),
    ("Heat Sink Tube (3mm, 5mm, 10mm)", "Miscellaneous", 1),
    ("Double Side Tape 3M Brand", "Miscellaneous", 1),
    ("Locktite", "Miscellaneous", 1),
    ("Neodium Magnet", "Miscellaneous", 8),
    ("Nylon Cable Tie (100mm & 150mm)", "Miscellaneous", 2),
    ("MEMORY CARD 32 GB", "Miscellaneous", 1),
    ("Sandisk 64 GB Card", "Miscellaneous", 2),
    ("HDMI TO VGA ADAPTER", "Miscellaneous", 1),
    ("VGA CABLE 3M", "Miscellaneous", 1)
]

values_list = []
for name, cat, qty in sql_items:
    safe_name = name.replace("'", "''")
    safe_cat = cat.replace("'", "''")
    values_list.append(f"('{safe_name}', '{safe_cat}', {qty}, {qty})")

sql_query = "INSERT INTO hardware (name, category, \"totalQuantity\", \"availableQuantity\")\nVALUES\n" + ",\n".join(values_list) + ";"

print("Total items:", len(sql_items))
with open("c:/Users/nisha/Downloads/V3 website/Robotics-club-v2/reference-v2/sql/insert_pdf_hardware.sql", "w") as f:
    f.write(sql_query)
