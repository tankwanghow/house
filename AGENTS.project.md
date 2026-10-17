This project is to create a Elixir Phoenix LiveView system that control the Poultry Layer Close house which include temperature, humidity, lighting, feeding and eggs collection.

The poultry house is 100L x 14W x 3.8H (meter). Due to the large area of the house and wiring complexity. Please plan hardware accordingly.

For temperature and humidity the house has 14 fans, 3 cooling pads water pump,  6 temperature and humidity sensor.

For feeding there 4 front limit switches and 4 end limit switches to control stop of the 4 feeding hoppers. The feeding hopper start will be control by a time schedule

There also 4 limit switch which is trigger by a rotating pulley that will trigger a on/off pulse, to indicate that the feeding hoppers is moving at the speed expected.

The feeding hopper will be fill up by a 2 Filling conveyors, which has a 2 limit switches indicating hopper full.

The 5 rows light that can be control individually using a timer.

Eggs Collection start, stop also control by a time schedule or manually, with 32 eggs conveyors, controlled by 4 motors, each motor control 8 conveyors.

Water for the chickens will be continuous, I need a digital water consumption meter to read data.

If condition suitable, all equipment will AC powered.

Don't have to worry about the actuators or motors suppliers has is figure out. I just need to control the start and stop signal.

All actuators or motors are 3 phase AC powered.

The fans is 2.5hp 3 phase. my farm is in malaysia with about 200-240v per phase.

Water pump, feeding hopper, feeding filling and eggs collection conveyor motors are 2 hp. 

use replaceable relay for each individual on/of controller to allow easy maintenance.

Don't have to think about the equipment in the AC panel, I just need to send digital on/off signal to the AC relay in the AC panel.

4 eggs collection  conveyors, 4 feeding hoppers, 4 front feeding hopper stop limit switches, 4 back feeding hopper stop limit switches, 4 feed hoppers pulse limit switches to detect is running at the right speed, 2 feed filling conveyors, 2 feed filling conveyor limit switches, 3 cooling pad water pump and 5 row light switches is in the front, 6 sensors are distributed evenly in the house. only 14 fans is located at the back of the house.

The amount of fans and cooling pads pump switched on and off has to be control be the Brain(PI), according to the temp and hum range set by the user.

Temperature and humidity sensors is XY-MD03 RS485

Front and Back Feed hopper Limit switch is HY-M907

The Feed hopper speed pulse limit switch is ME-8104

The brain of the system is ED­-HMI3120-­101C-­10432­-S

The digital IO module is Wavashare Modbus RTU IO 8CH - has 8 digital input and 8 digital output channels

4 front and 4 back hopper STOP switches, 2 feed filling conveyors switch have to stop immediately without waiting for the signal from PI.

the feed hopper have a forward and reverse function, where the motor will ran forward and reverse action

when the front limit switch on and back limit switch off then feed hopper action forward.

when the back limit switch on and front limit switch off then feed hopper action reverse.

All fans has to be normally switch on to prevent brain of the system PI ED­-HMI3120-­101C-­10432­-S lost of power, or DC power supply burn out cause poultry ventilation fans stop. 

each individual fans, pumps, motors, row of light should have a hardwired manual mode, so that human can by pass the control system during maintenance and testing. but the status (on/off and auto/manual) of those items should be visible to the HMI even in manual mode.

I think I should have 2 panels design, front panel Brain, back panel control the fans send status feedback to the front HMI.

Back panel only run 14 fans and return feedback and status to the hmi.

My is the only connection between the front and back panel is the RS485 wire.

At the phoenix liveview part I wish the project structure like https://nerves.redwirelabs.com/runbooks/naked-phoenix

I will be using sqlite3 as database for phoenix liveview

I don't have a water meter selected yet and suggestion. I will program the system to read current meter amount and deduct the previous read amount to decide the usage.

This conversation belongs to a Grok project. The project's files are mounted at `/workspace/artifacts` — look there for user-provided sources before concluding the workspace has no project files. Files written there persist to the project across conversations.