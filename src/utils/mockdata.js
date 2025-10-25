export const mockMySchedule = {
  "$id": "1",
  "$values": [
    {
      "$id": "2",
      "date": "2025-10-19",
      "slots": {
        "$id": "3",
        "$values": [
          {
            "$id": "4",
            "slotId": 1,
            "technicianWorkSlots": {
              "$id": "5",
              "$values": [
                {
                  "$id": "6",
                  "status": "NotStarted",
                  "appointments": {
                    "$id": "7",
                    "$values": [
                      {
                        "$id": "8",
                        "appointmentId": 2,
                        "repairRequestId": 21,
                        "startTime": "2025-10-20T09:26:04.168Z",
                        "endTime": "2025-10-20T10:26:04.168Z",
                        "status": "Assigned",
                        "createdAt": "2025-10-20T17:42:44.730068Z",
                        "note": "string",
                        // kỹ thuật viên
                        "technicians": {
                          "$id": "9",
                          "$values": [
                            {
                              "$id": "10",
                              "userId": 6,
                              "firstName": "Kỹ Thuật Viên",
                              "lastName": "Số 2",
                              "phoneNumber": "0903000002",
                              "email": "technician2@aptcare.vn"
                            }
                          ]
                        },
                        // thêm apartment cho AppointmentCard (đọc roomNumber)
                        "apartment": {
                          "$id": "11",
                          "apartmentId": 1,
                          "roomNumber": "P201",
                          "floor": 2,
                          "roleInApartment": "Owner"
                        },
                        // thêm resident info (user info của cư dân)
                        "resident": {
                          "$id": "12",
                          "firstName": "Chủ",
                          "lastName": "P101_1",

                          "email": "resident1@aptcare.vn",
                          "phoneNumber": "0810000001",
                          "citizenshipIdentity": "200000001"
                        }
                      },{
                        "$id": "8",
                        "appointmentId": 4,
                        "repairRequestId": 50,
                        "startTime": "2025-10-20T09:26:04.168Z",
                        "endTime": "2025-10-20T10:26:04.168Z",
                        "status": "Assigned",
                        "createdAt": "2025-10-20T17:42:44.730068Z",
                        "note": "string",
                        // kỹ thuật viên
                        "technicians": {
                          "$id": "9",
                          "$values": [
                            {
                              "$id": "10",
                              "userId": 6,
                              "firstName": "Kỹ Thuật Viên",
                              "lastName": "Số 2",
                              "phoneNumber": "0903000002",
                              "email": "technician2@aptcare.vn"
                            }
                          ]
                        },
                        // thêm apartment cho AppointmentCard (đọc roomNumber)
                        "apartment": {
                          "$id": "11",
                          "apartmentId": 1,
                          "roomNumber": "P101",
                          "floor": 1,
                          "roleInApartment": "Owner"
                        },
                        // thêm resident info (user info của cư dân)
                        "resident": {
                          "$id": "12",
                          "firstName": "Chủ",
                          "lastName": "P101_1",
                          "email": "resident1@aptcare.vn",
                          "phoneNumber": "0810000001",
                          "citizenshipIdentity": "200000001"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
        ]
      }
    },
    {
      "$id": "13",
      "date": "2025-10-20",
      "slots": {
        "$id": "14",
        "$values": [
          {
            "$id": "15",
            "slotId": 2,
            "technicianWorkSlots": {
              "$id": "16",
              "$values": [
                {
                  "$id": "17",
                  "status": "NotStarted",
                  "appointments": {
                    "$id": "18",
                    "$values": [
                      {
                        "$id": "19",
                        "appointmentId": 3,
                        "repairRequestId": 31,
                        "startTime": "2025-10-20T01:30:00.000Z",
                        "endTime": "2025-10-20T03:00:00.000Z",
                        "status": "Assigned",
                        "createdAt": "2025-10-19T23:50:00.000Z",
                        "technicians": {
                          "$id": "20",
                          "$values": [
                            {
                              "$id": "21",
                              "userId": 5,
                              "firstName": "Kỹ Thuật Viên",
                              "lastName": "Số 1",
                              "phoneNumber": "0903000001",
                              "email": "technician1@aptcare.vn"
                            }
                          ]
                        },
                        "apartment": {
                          "$id": "22",
                          "apartmentId": 2,
                          "roomNumber": "P102",
                          "floor": 2,
                          "roleInApartment": "Owner"
                        },
                        "resident": {
                          "$id": "23",
                          "firstName": "Chủ",
                          "lastName": "P102_1",
                          "email": "resident2@aptcare.vn",
                          "phoneNumber": "0810000002",
                          "citizenshipIdentity": "200000002"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
};