#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include "config.h"

// init sensor manager
void sensor_manager_init(void);

// update sensor readings with gradual changes
void sensor_manager_update(sensor_data_t* sensors);

// get current sensor readings
void sensor_manager_get_readings(sensor_data_t* sensors);

#endif // SENSOR_MANAGER_H