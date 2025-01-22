body {
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #000;
    overflow: hidden; /* Prevent scrolling */
}

#game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
}

#gameCanvas {
    width: 100%;
    height: 100%;
    background-color: #222;
    border: 2px solid #fff;
}

#health, #time {
    position: absolute;
    top: 10px;
    color: white;
    font-size: 24px;
}

#health {
    left: 10px;
}

#time {
    right: 10px;
}
