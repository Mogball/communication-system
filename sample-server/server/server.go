package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"time"

	"github.com/buger/jsonparser"
	"github.com/xtaci/kcp-go"
)

func main() {
	// Choose port to listen from
	listener, err := kcp.ListenWithOptions(":10000", nil, 10, 3)
	checkError(err)

	for {
		conn, err := listener.Accept() // Wait for call and return a Conn
		if err != nil {
			continue
		}
		go handleClient(conn)
	}
}

func handleClient(conn net.Conn) {
	start := time.Now()
	i := 0
	buf := make([]byte, 1024)
	defer conn.Close()
	for {
		success := true
		var id string
		var iderr error
		n, err := conn.Read(buf)
		if err != nil {
			fmt.Println("Error: ", err)
			success = false
			break
		} else {
			i++
			data := buf[0:n]
			if i%100 == 0 {
				fmt.Println(time.Duration(int64(time.Since(start)) / int64(i)))
				fmt.Printf("%s\n", string(data))
			}
			id, iderr = jsonparser.GetString(data, "id")
		}
		if iderr == nil {
			acknowledgeMessage(conn, id, success)
		}
	}
}

// Let client know message was recieved
func acknowledgeMessage(conn net.Conn, id string, success bool) {
	msg := map[string]interface{}{"id": id, "type": "recieved", "success": success}
	bytes, err := json.Marshal(msg)
	checkError(err)
	if err == nil {
		_, err2 := conn.Write(bytes)
		checkError(err2)
	}
}

// Check and print errors
func checkError(err error) {
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s", err.Error())
	}
}
