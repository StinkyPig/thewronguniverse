
/* CANVAS stuff */
var canvas=document.getElementById('canvas');
var context=canvas.getContext('2d');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

/* object to hold time info */
var gameTime={
    lastStamp:0, //last timestamp - a new timestamp is fetched every frame at the begining of the sync() function
    deltaTime:1 // time passed since previous frame - used to calculate every movement iin the game.
};

/*object to hold game control info*/
var gameControl={
    keyPressed:{
        left:false,
        right:false,
        up:false,
        down:false,
        fire:false
    },
    newEnemyWave:0, // time untiil new enemy wave released
    score:0, // player's score
    pickUpTime:0, //next pickup time
    nextPickup:2, // 1=guns, 2=speed,3=shields
    pickupGap:1200,// how many milliseconds 'til next pickup spawn
    gameStage:0, // 0=menu, 1=get ready, 2==play, 3Game over text in, 4=gameover wait, 5=game over text out
    getReadyAlpha:0, // for the alpha fade on stage 1
    score:0,
    stage: 0, // game stage 0=menu, 1=get ready, 2=play, 3=game over text grow in, 4=game over wait, 5=game over text shrink out
    stageTimer: 0, // timer to be used in the animation of text in stages such as 'Get Ready' and 'Game Over'
    stageAlpha: 0, // as above with alpha rather than time
    stageSize: 0, // ditto size
    asteroids:{ // object for asteroid control
        time: 0, // time 'til next asteroid spawned
        gap: 1500 // gap in milliseconds between asteroid spawns
    },
    debug: false,// debug mode - used to show certain info - like collision boxes/circles

}

var cols=[// some purty colours
    { stroke:'#16a085', fill:'#1abc9c' },
    { stroke:'#27ae60', fill:'#2ecc71' },
    { stroke:'#2980b9', fill:'#3498db' },
    { stroke:'#8e44ad', fill:'#9b59b6' },
    { stroke:'#f39c12', fill:'#f1c40f' },
    { stroke:'#d35400', fill:'#e67e22' },
    { stroke:'#c0392b', fill:'#e74c3c' }
]

var enemies = []; // array for enemy objects 
var particles = [];
var pickups = [];
var billboards = [];
var enemyBullets = [];

var soundFX={ // for all sound effects.
    playerShot: new Audio('laser.ogg'),
    explosion: new Audio('explosion.ogg')
}

/* event listener for keys pressed */
document.addEventListener('keydown',function(e){
    
    let keyCode = e.which;
    
    if ( keyCode == 37 || keyCode == 65 ){ // left arrow or 'a'
        gameControl.keyPressed.left = true;
    } else if ( keyCode == 39 || keyCode == 68 ) gameControl.keyPressed.right = true; // right arrow or 'd'
    
    if ( keyCode == 38 || keyCode == 87 ){ // up arrow or 'w'
        gameControl.keyPressed.up = true;
    } else if ( keyCode == 40 || keyCode == 83 ) gameControl.keyPressed.down = true; // down arrow or 's'
    
    if( keyCode ==32 ) gameControl.keyPressed.fire = true;

});

/*event listener for keys released */
document.addEventListener('keyup',function(e){
    
    let keyCode = e.which;
    
    if ( keyCode == 37 || keyCode == 65 ) gameControl.keyPressed.left = false; // left arrow or 'a'
    if ( keyCode == 39 || keyCode == 68 ) gameControl.keyPressed.right = false; // right arrow or 'd'
    if ( keyCode == 38 || keyCode == 87 ) gameControl.keyPressed.up = false; // up arrow or 'w'
    if ( keyCode == 40 || keyCode == 83 ) gameControl.keyPressed.down = false; // down arrow or 's'
    if( keyCode ==32 ) gameControl.keyPressed.fire = false;

});

/********************************************************************************** */
/********************************F U N C T I O N S********************************* */
/********************************************************************************** */

// turn percentage to pixels of canvas width - returns pixels
function pixelSize( percent ){
    return canvas.width * percent / 100;
}

function posObj(o){// draw object/sprite - o=object
    let s = pixelSize( o.size );
    for (let i = 0; i < o.polygons.length; i++ ){// loop through polys
        if( o.hitTime ){
            context.strokeStyle = ( gameTime.lastStamp > o.hitTime ) ? o.polygons[i].stroke : '#411';
            context.fillStyle = ( gameTime.lastStamp > o.hitTime ) ? o.polygons[i].fill : '#501';
        }else{
            if( o.polygons[i].stroke ) context.strokeStyle = o.polygons[i].stroke;
            if( o.polygons[i].fill ) context.fillStyle = o.polygons[i].fill;
        }
        context.lineWidth = ( o.polygons[i].lineWidth ) ? s * o.polygons[i].lineWidth : s * 0.03;
        context.shadowColor = ( o.polygons[i].shadow) ? o.polygons[i].shadow: 'transparent';
        if( o.polygons[i].shadowBlur) context.shadowBlur = s * o.polygons[i].shadowBlur / 100;
        context.beginPath();
        context.lineCap = ( o.polygons[i].lineCap ) ? o.polygons[i].lineCap: 'butt';
        if( o.polygons[i].lines ){
            for ( let j=0; j < o.polygons[i].lines[0].length; j+= 2 ){
                j > 0 ? context.lineTo( 
                    o.position.x + Math.cos( (o.angle + o.polygons[i].lines[0][j]) * Math.PI / 180 ) * s * o.polygons[i].lines[0][j+1] / 100,
                    o.position.y + Math.sin( (o.angle + o.polygons[i].lines[0][j]) * Math.PI / 180 ) * s * o.polygons[i].lines[0][j+1] / 100 ) :
                    context.moveTo( 
                    o.position.x + Math.cos( (o.angle + o.polygons[i].lines[0][j]) * Math.PI / 180 ) * s * o.polygons[i].lines[0][j+1] / 100,
                    o.position.y + Math.sin( (o.angle + o.polygons[i].lines[0][j]) * Math.PI / 180 ) * s * o.polygons[i].lines[0][j+1] / 100 
                );
            }
        }
        if( o.polygons[i].arc){
            for ( let j=0; j < o.polygons[i].arc[0].length; j+= 5 ){
                context.arc( 
                    o.position.x + Math.cos( (o.angle + o.polygons[i].arc[0][j]) * Math.PI / 180 ) * s * o.polygons[i].arc[0][j+1] / 100,
                    o.position.y + Math.sin( (o.angle + o.polygons[i].arc[0][j]) * Math.PI / 180 ) * s * o.polygons[i].arc[0][j+1] / 100, 
                    o.polygons[i].arc[0][j+2] * s / 100, 
                    o.polygons[i].arc[0][j+3], 
                    o.polygons[i].arc[0][j+4] 
                );
            }
        }
        context.closePath();
        if( o.polygons[i].stroke ) context.stroke();
        if( o.polygons[i].fill ) context.fill();
    }
    if( gameControl.debug ){//this bit draws collision boxes and circles if debug flag true        
        if ( o.collision ){
            context.strokeStyle = 'green';
            context.lineWidth = 1;
            if( o.collision.circle ){
                for( let i = 0; i < o.collision.circle.length; i+= 3 ){
                    context.beginPath();
                    context.arc( o.position.x + ( s * o.collision.circle[i] / 100 ), o.position.y + ( s * o.collision.circle[i+1] / 100 ), 
                        s * o.collision.circle[i+2] / 100, 0, 2 * Math.PI 
                    );
                    context.stroke();
                    context.closePath();

                }
            }
            if( o.collision.rectangle ){
                for( let i = 0; i < o.collision.rectangle.length; i+= 4 ){
                    context.beginPath();
                    context.rect( o.position.x + Math.cos( o.collision.rectangle[i] * Math.PI / 180 ) * s * o.collision.rectangle[i+1] / 100,
                        o.position.y + Math.sin( o.collision.rectangle[i] * Math.PI / 180 ) * s * o.collision.rectangle[i+1] / 100,
                        s * o.collision.rectangle[i+2] / 100, s * o.collision.rectangle[i+3] / 100
                    );
                    context.stroke();
                    context.closePath();
                }
            }
        }
    }
}

function spawnEnemy(){//spawn random enemy
    let r = Math.random(); // random number to decide on enemy type
    let d = Math.random(); // different random number used for direction
    for ( let i = 0; i < ( player.weapons.guns + player.weapons.speed + player.weapons.shields ); i++ ){// number of enemies spawned is determined by how strong player weapons are
        if( r < 0.5 ){ // either all eyeballs or......... 
            enemies.push( new eyeballEnemy( i * 25, d ) );// spawn new spinny eyeball enemy and push it onto enemies[] array. d rereents direction and i*25 is the initial angle the eyball sits in its circle/arc
        }else{//...........all mixture of the two different enemiey ship types
            let col=randomInt( 0, 6 );// random index 0-6 to be taken from cols[] array
            Math.random() < 0.5 ? enemies.push( new homingEnemy( Math.random()*canvas.width, i * 2 , col ) ) : enemies.push( new straightDownEnemy( col, i*50 ) ); // spawn one of the two enemy ships and push it onto enemies[] array
        }
    }
}

function explosion(x, y, size, canPickup){ //explosion - canPickup = is a pickup possible, crashes into by enemmies into play ship don't spawn pickup ; size = size in % of screen width
    for ( let i = 0; i < 25; i++ ){ //spawn 25 explosion clouds
        particles.push( new explosionCloud( x + (Math.random()-0.5 ) * pixelSize( size ) / 2, y + (Math.random()-0.5 ) * pixelSize( size ) / 2, size) ); // spawn a random size cloud at randowm x,y within explosion size, and push it onto particles[] array
        if( i < 12 )particles[i].delay = 0;  // no delay for first dozen explosion clouds
    }
    if( canPickup && gameTime.lastStamp > gameControl.pickUpTime){ //if this explosion is pickup spawnable, is it time for a pickup spawn?
        gameControl.pickUpTime = gameTime.lastStamp + gameControl.pickupGap; // set new time for next pickup spawn
        pickups.push( new pickup( x, y, gameControl.nextPickup ) );// spawn a new pickup and push  it onto pickups[] array
        gameControl.nextPickup = gameControl.nextPickup % 3 + 1; // add 1 to next pixk up using mod(%) to keep in 1-3 range
    }
    gameControl.score++; // every kill is worth 1 point
    playSFX( soundFX.explosion ); // play the explosion sound
}

function collision( o1, o2 ){//chheck for collision between 2 objects
    let s1 = pixelSize( o1.size ), s2 = pixelSize( o2.size ); //size in pixels of each object
    if ( o1.collision.circle ){//does object 1 have collision circles?
        for( let i = 0; i < o1.collision.circle.length; i += 3 ){ //if yes, let's cycle through them
            let x1 = o1.position.x + Math.cos( o1.collision.circle[i] * Math.PI / 180 ) * s1 * o1.collision.circle[i+1] / 100;// object 1 collision circle's x in pixels
            let y1 = o1.position.y + Math.sin( o1.collision.circle[i] * Math.PI / 180 ) * s1 * o1.collision.circle[i+1] / 100;// object 1 collision circle's y in pixels
            let r1 = o1.collision.circle[i+2] * s1 / 100;//object 1 collision circle's radius in pixels
            if( o2.collision.circle ){//does object 2 have collision circles?
                for ( let j = 0; j < o2.collision.circle.length; j += 3 ){//if yes, let's cycle through them
                    let x2 = o2.x + Math.cos( o2.cl.c[j] * Math.PI / 180 ) * s2 * o2.cl.c[j+1] / 100;// object 2 collision circle's x in pixels
                    let y2 = o2.y + Math.sin( o2.cl.c[j] * Math.PI / 180 ) * s2 * o2.cl.c[j+1] / 100;// object 2 collision circle's y in pixels
                    let r2 = o2.cl.c[j+2] *s1 / 100;//object 2 collision circle's radius in pixels
                    let dx = x1-x2; // difference on the x
                    let dy = y1-y2; // difference on the y
                    if ( ( r1 + r2 ) > Math.sqrt( dx * dx + dy * dy ) ){//if circles's joint radii is greater than the distance between both circle's centre then we have a hit
                        return true; //yes, we bumped no need for anymore checks
                    }
                }
            }
            if (o2.collision.rectangle){//does object 2 have collision rectangles?
                for( let j = 0; j < o2.collision.rectangle.length; j+= 4 ){//if yes, let's cycle through them
                    let x2 = o2.position.x + Math.cos( o2.collision.rectangle[j] * Math.PI / 180 ) * s2 * o2.collision.rectangle[j+1] / 100;// object 2 collision rectangle x position 
                    let y2 = o2.position.y + Math.sin( o2.collision.rectangle[j] * Math.PI / 180 ) * s2 * o2.collision.rectangle[j+1] / 100;// object 2 collision rectangle y position
                    let w2 = s2 * o2.collision.rectangle[j+2] / 100;// object 2 collision rectangle width
                    let h2 = s2 * o2.collision.rectangle[j+3] / 100;// object 2 collision rectangle height
                    if( circleRectangle( x2, y2, w2, h2 ,x1 ,y1 ,r1 ) )return true;// if true we hit
                }
            }
        }
    }
    if( o1.collision.rectangle ){// does object 1 have collision rectangles?
        for( let i = 0; i < o1.collision.rectangle.length; i += 4){//cycle through them
            let x1 = o1.position.x + Math.cos( o1.collision.rectangle[i] * Math.PI / 180 ) * s1 * o1.collision.rectangle[i+1] / 100;// obj1 x of collision box
            let y1 = o1.position.y + Math.sin( o1.collision.rectangle[i] * Math.PI / 180 ) * s1 * o1.collision.rectangle[i+1] / 100;// obj1 y of collision box
            let w1 = s1 * o1.collision.rectangle[i+2] / 100;//obj1 collision box width
            let h1 = s1 * o1.collision.rectangle[i+3] / 100;//obj1 collision box height
            if ( o2.collision.circle ){//obj 2 have collision circles?
                for( let j = 0; j < o2.collision.circle.length; j += 3){//cycle through them
                    let x2 = o2.position.x + Math.cos( o2.collision.circle[j] ) * s2 * o2.collision.circle[j+1] / 100;//obj2 circle x
                    let y2 = o2.position.y + Math.sin( o2.collision.circle[j] ) * s2 * o2.collision.circle[j+1] / 100;//obj2 circle y
                    let r2 = o2.collision.circle[j+2] * s2 / 100//obj2 circle radius
                    if( circleRectangle( x1, y1, w1, h1, x2, y2, r2 ) )return true;// if true we have hit
                }
            }
            if ( o2.collision.rectangle){// obj 2 have collision rectangles?
                // there's no box-on-box collisions in game ATM so donn't need to write this code yet.
            }
        }
    }

    return false; //no hits

    function circleRectangle( rx, ry, rw, rh, cx, cy, cr ){//circle-rectangle collision check - rx,ry,rw,rh = rectangle - cx,cy,cr = circle
        let dx = Math.abs( cx - rx - rw / 2 );
        let dy = Math.abs( cy - ry - rh / 2 );//distance x and distance y between centres
        if( dx > ( rw / 2 + cr ) || dy > ( rh / 2 + cr ) ) return false;// can't be colliding
        if(dx<=(rw/2) || dy<=(rh/2)) return true;// definate hit
        dx = dx - rw / 2;
        dy = dy - rh / 2;
        return ((cr*cr)>dx*dx+dy*dy); // touching at corner?
    }       
}

function playSFX(e){ // playsound effects
    e.currentTime=0;
    e.play();
}

function randomInt(min, max){ //return random integer between min and max inclusive
    return Math.floor( Math.random() * ( max - min + 1 )) + min;
}

function sync() {// the callback function called by requestAnimationFrame - update objects and draw frame
    
    //update time data
    let timeStamp=Date.now();
    gameTime.lastStamp==0 ? gameTime.deltaTime=17 : gameTime.deltaTime = timeStamp - gameTime.lastStamp; // if first frame we'll set delta for 60fps - dosn't realy matter, it's only 1 frame
    gameTime.lastStamp=timeStamp;// record current timestamp

    //clear last frame
    context.fillStyle='#2c3e50';
    context.fillRect( 0, 0, canvas.width, canvas.height );
    
    for( let i=0; i < 3; i++ ){// starfield
        for( let j = 0; j < starfield[i].length; j++ ){
            starfield[i][j].update();
        }
    }

    if( timeStamp > gameControl.newEnemyWave ){ // time to spawn enemy wave?
        gameControl.newEnemyWave = timeStamp + 4000;// new enemy spawn time
        spawnEnemy();
    }

    for ( let i = pickups.length - 1; i>-1 ; i-- ){ // pickups, loop backwards to avoid element being missed after splicing
        if( pickups[i].update() ){ // if return true then pick=dead
            pickups.splice( i, 1 );
        }
    }

    if ( gameControl.stage == 2 ) player.update(); // update player if in a game

    for ( let i = enemies.length - 1; i > -1; i-- ){ // loop backwards to avoid element being missed after splicing
        if( enemies[i].update() ){ //the enemy update function will return true if this object is to cease to exist
            enemies.splice( i, 1 ); // in which case we take it out of the array.  No need to delete object as there are now references to it, so Javascript should clean it up
        }
    }

    for ( let i = player.bullets.length-1; i > -1; i-- ){ // player bullets - loop backwards to avoid element being missed after splicing
        if( player.bullets[i].update() ){//if return true then bullet=dead
            player.bullets.splice( i, 1 );
        }
    }
    for ( let i = particles.length-1; i > -1; i-- ){ // particle - loop backwards to avoid element being missed after splicing
        if( particles[i].update() ){
            particles.splice(i,1);
        }
    }
    for ( let i = enemyBullets.length-1; i > -1; i-- ){ //enemy bullets, loop backwards to avoid element being missed after splicing
        if( enemyBullets[i].update() ){//if return true then bullet=dead
            enemyBullets.splice( i, 1);
        }
    }
    
    if ( gameTime.lastStamp > gameControl.asteroids.time ){//time for an asteroid?
        enemies.push( new asteroid() );// create new astroid object and push it onto enemies[] array
        gameControl.asteroids.time = gameTime.lastStamp + gameControl.asteroids.gap; //new time to wait for asteroid spawn
    }

    for ( let i = billboards.length-1; i> -1; i-- ){ // billboards, loop backwards to avoid element being missed after splicing
        if( billboards[i].update() ){//returns true if billboard dead
            billboards.splice( i, 1 );
        }
    }
    /* HUD */
    hud.gunIcon.update();
    hud.speedIcon.update();
    hud.shieldIcon.update();
    hud.score.update();

    switch( gameControl.stage ){

        case 2:
            // game playing
            break;
        
        case 0:// menu stage
            context.fillStyle='rgba(0,0,0,.6)';
            context.fillRect(0,0,canvas.width,canvas.height);//faded background
            /* The menu text */
            context.fillStyle='#34495e';
            context.strokeStyle='#ecf0f1';
            context.shadowBlur=0;
            context.textAlign='center';
            context.font=Math.round(canvas.width*.1).toString()+'px impact';
            context.strokeText('The Wrong Universe',canvas.width/2,canvas.height/3);
            context.fillText('The Wrong Universe',canvas.width/2,canvas.height/3);
            context.font=Math.round(canvas.width*.03).toString()+'px impact';
            context.strokeText('Cursor Keys or WASD to move.',canvas.width/2,canvas.height/2);
            context.fillText('Cursor Keys or WASD to move.',canvas.width/2,canvas.height/2);
            context.strokeText('Space key to fire',canvas.width/2,canvas.height*.6);
            context.fillText('Space key to fire',canvas.width/2,canvas.height*.6);
            context.font=Math.round(canvas.width*.05).toString()+'px impact';
            context.strokeText('Press fire to play',canvas.width/2,canvas.height*.8);
            context.fillText('Press fire to play',canvas.width/2,canvas.height*.8);
            /* if fire pressed move to stage 1 and initialise all relevant variables */
            if ( gameControl.keyPressed.fire ){
                gameControl.stage = 1;
                gameControl.stageAlpha = 1;
                gameControl.stageTimer = gameTime.lastStamp + 1250; // this will be how long 'GET READY' will show fully opaque before alpha fade
                player.position.x = canvas.width / 2,
                player.position.y = canvas.height * 0.92,
                player.weapons.guns = 1; player.weapons.speed = 0; player.weapons.shields = 0;
                gameControl.score=0;
                gameControl.pickupGap = 1200;
                /* turn on players post hit flag for few seconds (makes player ship indistructable - flashes when in this stage) */
                player.postHit.flag = true;
                player.postHit.time = gameTime.lastStamp + 4000;
                player.postHit.flash = 1; // 1 is on -1 is off - we'll starrt with on
                player.postHit.flashTime = gameTime.lastStamp + 50; // 50 milliseconds between on and off for flash
            }
            break;

        case 1://'GET READY' stage
            /* display 'GET READY' at alpha strength of gameControl.stageAlpha */
            context.fillStyle='rgba(255,255,255,' + gameControl.stageAlpha.toString() + ')';
            context.textAlign='center';
            context.font=canvas.width*.2+'px impact';
            context.fillText('GET READY',canvas.width/2,canvas.height/2);
            if( gameTime.lastStamp > gameControl.stageTimer ) gameControl.stageAlpha -= 0.001 * gameTime.deltaTime;// fade if 'GET READY' has been displayed long enough
            if( gameControl.stageAlpha < 0 ) gameControl.stage = 2;// if alpha drops below 0 then move on to stage 2 (actual gameplay)
            break;

        case 3:// 'GAME OVER' text grow in
            context.fillStyle='#fff';
            context.textAlign='center';
            context.font = canvas.width * 0.2 * gameControl.stageSize + 'px impact'; //growsize proportionate to canvas width 
            context.fillText( 'GAME OVER', canvas.width/2, canvas.height / 2 );
            gameControl.stageSize += 0.001 * gameTime.deltaTime;// grow text
            if (gameControl.stageSize > 1){ // if fully grown go to stage 4
                gameControl.stage = 4;
                gameControl.stageTimer = gameTime.lastStamp + 1250; // 'game over' will stay full sized for 1.25 seconds
            }
            break;

        case 4:// 'GAME OVER' wait for it......
            context.fillStyle='#fff';
            context.textAlign='center';
            context.font = canvas.width *0.2 + 'px impact';
            context.fillText( 'GAME OVER', canvas.width / 2, canvas.height / 2 );
            if ( gameTime.lastStamp > gameControl.stageTimer ){/// wait for it........
                gameControl.stage = 5;// next stage 5
                gameControl.stageSize = 1; //starts fully grown i.e. 1
            }
            break;

            case 5:// nearly same as stage 3, just in reverse.  Just srinks slower than it grew
                context.fillStyle='#fff';
                context.textAlign='center';
                context.font=canvas.width * 0.2 * gameControl.stageSize + 'px impact';
                context.fillText( 'GAME OVER', canvas.width / 2, canvas.height / 2 );
                gameControl.stageSize -= 0.0005 * gameTime.deltaTime; // shrinks at half the speed it grew
                if( gameControl.stageSize < 0 ) gameControl.stage = 0; //size smaller than zero? stage set to 0(menu)
                break;

            default:
                console.log('Error: stage ' + gameControl.stage + ' does not exist');
    }

    window.requestAnimationFrame(sync); // keep the magic going :)
}



/* sprite/obj - all x and y data of lines and arcs are stored as angle and hypotenuse pairs which posObj() turns to actual pixel x,y co-ords
   hypotenuse is percentage figure.
   this makes scaling and rotating the sprite very simple

/****************** C O N S T R U C T E R    O B J E C T S (CLASSES)****************** */

function asteroid(){
    this.size = randomInt(5,20); //scale - percentage of screen width
    this.position = {
        x: canvas.width * Math.random(),
        y: 0 - pixelSize( this.size ) / 2, //just off top of screen
    };
    this.velocity = {
        y: ( 25 - this.size ) * 0.0125,
        angle: ( 25 - this.size ) * 0.00005
    };
    this.angle = Math.random() * 359;
    if (Math.random()>.5) this.velocity.angle*= -1; // let's have half of them spin backwards
    this.hitTime=0; //used when hit to display as hit colour for so long (75 milliseconds)
    this.polygons=[
        {
            stroke:'#594231',
            fill:'#836049',
            lines:[
                [
                    270,50,
                    300,50,
                    340,50,
                    350,50,
                    20,50,
                    70,50,
                    100,50,
                    140,48,
                    190,50,
                    230,50,
                    270,50
                ]
            ]   
        },{
            stroke:'#997055',
            fill:'#997055',
            lines:[
                [
                    270,43,
                    300,40,
                    340,42,
                    350,40,
                    20,40,
                    70,43,
                    100,40,
                    140,40,
                    190,42,
                    230,40,
                    270,43
                ]
            ]
        },{
            stroke:'#836049',
            fill:'#836049',
            lines:[
                [
                    225,25,
                    270,25,
                    295,25,
                    310,25,
                    310,14,
                    270,5,
                    250,5,
                    220,15,
                    225,20
                ]
            ]
        },{
            stroke:'#836049',
            fill:'#836049',
            lines:[
                [
                    180,35,
                    185,32,
                    180,28,
                    175,34,
                    180,35
                ]
            ]
        },{
            stroke:'#836049',
            fill:'#836049',
            lines:[
                [
                    70,15,
                    100,15,
                    110,10,
                    69,5
                ]
            ]
        }
    ]
    this.collision={
        circle:[
            0,0,47
        ]
    }

    this.hit=function(p){// taken hit p=pickup possible (crashing into ship = no pickup)
        if( this.size < 6 ){ //if asteroid is small enough blow it up
            explosion( this.position.x, this.position.y, this.size, p);
            return true; // asteroid is dead
        }
        this.size--;// else shrink it
        this.hitTime = gameTime.lastStamp + 75;// and  set the time it will show as red to 75 milliseconds
        return false; // nope, it's not dead
    }

    this.update=function (){// called once per frame
        this.angle+= this.velocity.angle * gameTime.deltaTime;//rotate astroid
        this.position.y+= this.velocity.y * gameTime.deltaTime;// move it
        posObj( this ); //draw it
        if ( this.position.y > pixelSize( this.size ) / 2 + canvas.height ) return true; // if asteroid gone off screen
        if ( gameControl.stage == 2 && !(player.postHit.flag) && collision( this, player )){ // if game playing and players post hit flag is off, do a collision check etween this astroid and the player ship
            player.hit();//player hit
            return this.hit( false );// this asteroid hit, no pickup because hit player, we return result of call to this.hit() - ie dead or not
        }
        return false;// if still on screen and not hit by player then still alive (bullet collisions will be taken care of by bullet's own collision checks)
    }
}

function homingEnemy(x,y,cl){ // enemy ship that homes in toward player - cl= index of colours array (cols[])
    this.size=5; // % of canvas width
    this.position = {
        x: x,
        y: 0 - (canvas.height * y / 100) - ( pixelSize( this.size ) / 2 ), // y recieved in function is percent of canvas height above screen.
    };
    this.velocity = {
        direction: 0.15 + Math.random() * 0.1, // a straight line velcity, no x&y velocity - movement will be calculated to move toward player each frame
        angle: 0
    };
    this.angle = 90;
    this.animationFrame = 0;
    this.polygons = [
        {
            stroke: cols[cl].border,
            fill: cols[cl].fill,
            lines: [
                [
                    0,10,
                    50,35,
                    110,42,
                    170,42,
                    190,42,
                    240,42,
                    310,35
                ]
            ]
        },{
            fill: cols[cl].border,
            lines: [
                [
                    0,5,
                    50,15,
                    90,20,
                    130,35,
                    150,35,
                    200,35,
                    230,35,
                    270,20,
                    310,15
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#95a5a6',
            lines: [
                [
                    45,37,
                    50,48,
                    120,45,
                    170,45,
                    190,45,
                    240,45,
                    310,48,
                    315,37,
                    240,35,
                    190,35,
                    80,35,
                    120,35
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#95a5a6',
            lines: [
                [
                    350,20,
                    10,20,
                    145,35,
                    170,48,
                    190,48,
                    215,35
                ]
            ]
        },{
            fill: '#bdc3c7',
            lines: [
                [
                    50,48,
                    50,45,
                    120,40,
                    170,35,
                    170,45,
                    1200,45
                ]
            ]
        },{
            fill: '#bdc3c7',
            lines: [
                [
                    310,48,
                    310,45,
                    240,40,
                    100,35,
                    190,45,
                    240,45
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#95a5a6',
            lines: [
                [
                    350,20,
                    10,20,
                    145,35,
                    170,48,
                    190,48,
                    215,35
                ]
            ]
        },{
            fill: '#bdc3c7',
            lines: [
                [
                    350,10,
                    10,10,
                    153,28,
                    170,42,
                    190,42,
                    207,28
                ]
            ]
        },{
            stroke: '#2c3e50',
            fill: '#34495e',
            lines: [
                [
                    348,3,
                    0,3.25,
                    12,3,
                    160,12,
                    180,13,
                    200,12
                ]
            ]
        }
    ]
    this.collision={
        circle: [
                0,-12,35
        ]
    }

    this.hit = function(p){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        explosion( this.position.x, this.position.y, this.size, p); // make explosion
        return true; // yep, it dead
    }

    this.update=function (){ // called once every frame
        //need the hypotenuse and the adjacent of a triangle from this obj to player to calculate the angle - adj=adjacent, hyp=hypotenuse ang= angle 
        let adj = player.position.y - this.position.y;
        let hyp = Math.sqrt( Math.pow( ( player.position.x - this.position.x ), 2 ) + Math.pow( ( player.position.y - this.position.y ), 2 ) ); // Pythagoras was one of the best Javascript coders in ancient Greece :)
        let ang = Math.acos( adj / hyp) * 180 / Math.PI;// voila, the angle this enemy must rotate to point at player - trig is cool!
        if( player.position.x > this.position.x ){//if the player ship is to the right of this enemy
            this.angle-= 0.1 * gameTime.deltaTime;// turn towards player position
            if( this.angle < (90-ang) ) this.angle = 90-ang;// if turned beyond direction of player then set angle to point directly at player
        }else{// if player ship is to the left, then do exact same stuff but in opposite direction
            this.angle+= 0.1 * gameTime.deltaTime;
            if( this.angle > (90+ang) )this.angle = 90+ang;
        }
        if ( this.angle < 40 ) this.angle = 40;// 50 degrees its left most we want enemy to point
        if ( this.angle > 140 ) this.angle = 140; // ditto right
        /* move it in the direction it is facing */
        this.position.x+= Math.cos( this.angle * Math.PI/180 ) * this.velocity.direction * gameTime.deltaTime;
        this.position.y+= Math.sin( this.angle * Math.PI/180 ) * this.velocity.direction * gameTime.deltaTime;
        posObj( this ); // draw the sprite
        if ( this.position.y > pixelSize( this.size ) / 2 + canvas.height ) return true; // if gone off screen
        if ( gameControl.stage == 2 && !(player.postHit.flag) && collision( player, this ) ){ // if game playing and players post-hit flag is off, do a collision check between this enemy and the player ship
            player.hit();// player's been hit
            return this.hit( false );// return result of hit, which is whether this enemy dies or not becauuse of hit - send false as pickup spawnable            
        }
        return false;// still on screen and not hit player the I'm still alive, bullets codewill deal with bullet hits
    }
}

function eyeballEnemy(cfx,dir){
    let xo = canvas.width * 8 / 100; let yo = canvas.height * 8 / 100;// x,y offsets
    let ratio = canvas.width / canvas.height;//ratio screen width/height so we can make tvelocity diagonal corner  to corner
    dir < 0.5 ?
        this.cf={
            x: 0-xo,
            y: 0-yo,
            xv: 0.005 * ratio,
            yv: 0.005,
            a: cfx
        }
        :
        this.cf={
            x: canvas.width+xo,
            y: 0-yo,
            xv: 0-.005 * ratio,
            yv: 0.005,
            a: cfx
        };
    this.size = 5; // % of canvas width
    this.position={x: 0,y: 0};
    this.angle = 0;
    this.bulletTime = gameTime.lastStamp + Math.random() * 2000;// time until fire bullet
    this.polygons=[

        {
            stroke: '688',
            fill: '#9aa',
            lines:[
                [
                    35,30,
                    15,30,
                    20,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    75,30,
                    45,30,
                    60,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    115,30,
                    85,30,
                    100,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    155,30,
                    125,30,
                    140,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    195,30,
                    165,30,
                    180,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    235,30,
                    205,30,
                    220,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    275,30,
                    245,30,
                    260,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    315,30,
                    285,30,
                    300,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    355,30,
                    325,30,
                    340,48
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    0,35,
                    15,35,
                    60,35,
                    90,35,
                    120,35,
                    150,35,
                    180,35,
                    210,35,
                    240,35,
                    270,35,
                    300,35,
                    330,35
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    345,30,
                    15,30,
                    0,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    305,30,
                    335,30,
                    320,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    265,30,
                    295,30,
                    280,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    225,30,
                    255,30,
                    240,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    185,30,
                    215,30,
                    200,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    145,30,
                    175,30,
                    160,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    105,30,
                    135,30,
                    120,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    65,30,
                    95,30,
                    80,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#9aa',
            lines:[
                [
                    25,30,
                    55,30,
                    40,50
                ]
            ]
        },{
            stroke: '#688',
            fill: '#eef',
            arc:[
                [
                    0,0,20,0,6.3
                ]
            ]
        },{
            stroke: '#038',
            fill: '#159',
            shadow: '#222',
            shadowBlurb: 5,
            arc:[
                [
                    0,0,10,0,6.3
                ]
            ]
        },{
            fill:'#38d',
            arc:[
                [
                    0,0,6,0,6.3
                ]
            ]
        },{
            fill:'#001',
            arc:[
                [
                    0,0,4,0,6.3
                ]
            ]
        }
    ]
    this.collision = {
        circle:[
                0,0,45
        ]
    }

    this.hit = function(p){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        explosion( this.position.x, this.position.y, this.size, p ); //make explosion
        return true; // yep, it be dead
    }

    this.update = function (){ // the workhorse of an object
        
        /* spin the two teeth rings by changing the even numbers(inc 0) of the lines of the polygons that draw the teeth rings - the even numbers of each lines[] array is the angle to get the position*/
        for ( let x = 0; x < 9; x++ ){
            for( let y = 0; y < 5; y += 2 ){
                this.polygons[x].lines[0][y]+= 0.1 * gameTime.deltaTime;
                this.polygons[x+10].lines[0][y]-= 0.1 * gameTime.deltaTime;
            }
        }
        /* get the angle from this eyeball to player ship */
        let adj = player.position.y - this.position.y;
        let hyp = Math.sqrt( Math.pow( ( player.position.x - this.position.x ), 2 ) + Math.pow( (player.position.y - this.position.y), 2) );
        let ang = Math.acos( adj / hyp ) * 180 / Math.PI;
        for( let i = 20; i < 23; i++){// and point the iris at the player
            this.polygons[i].arc[0][0] = ( player.position.x > this.position.x ) ? 90-ang : 90+ang;
            this.polygons[i].arc[0][1] = 10;
        }

        if( gameTime.lastStamp > this.bulletTime ){ //time to shoot a bullet
            enemyBullets.push( new enemyBullet( this.position.x, this.position.y ) );//spawn new bullet and push onto enemyBullets[] array
            this.bulletTime = gameTime.lastStamp + (3500+Math.random()*4000) - ( ( player.weapons.gguns + player.weapons.speed + player.weapons.shields ) * 200 );// next bullet time - more player weapons then shorter time
        }

        /* move the centre eye snake, and rotate it */ 
        this.cf.x += pixelSize( this.cf.xv ) * gameTime.deltaTime;
        this.cf.y += pixelSize( this.cf.yv ) * gameTime.deltaTime;
        this.cf.a += 0.2 * gameTime.deltaTime;
        /* position the eyeball */
        this.position.x = this.cf.x + Math.cos( this.cf.a * Math.PI / 180) * 150;
        this.position.y = this.cf.y + Math.sin( this.cf.a * Math.PI / 180) * 150;
        posObj( this );// draw the sprite
        if ( this.position.y > pixelSize( this.size ) / 2 + canvas.height ) return true; // if gone off screen
        if ( gameControl.stage == 2 && player.postHit.flag == false && collision( player, this ) ){// if game playing and players post-hit flag is off, do a collision check between this enemy and the player ship
            player.hit();// hit scored on player
            return this.hit( false );//return whether hit causes this eyeball to die
            
        }
        return false;// still on screen and not hit player then I'm alive - player bullets code will check if I been hit by bullet
    }
}

function star( x, y, s){
    this.size = s; // % of canvas width
    this.position = {
        x: x,
        y: y
    };
    this.angle = 0;
    this.velocity = { y: 0.06 * s};
    this.offScreen = pixelSize( s ) / 2; // half sprite height for off screen check in update()
    this.polygons=[
        {
            fill: '#aab',
            lines:[
                [   200,15,
                    260,40,
                    270,50,
                    280,40,
                    340,15,
                    20,15,
                    80,40,
                    90,50,
                    100,40,
                    160,15
                ]
            ]
        },{
            fill: '#aab',
            lines:[
                [
                    110,15,
                    170,40,
                    180,50,
                    190,40,
                    250,15,
                    290,15,
                    350,40,
                    0,50,
                    10,40,
                    70,15
                ]
            ]
        }
    ]
    this.update = function (){
        this.position.y += this.velocity.y * gameTime.deltaTime;
        if ( this.position.y> ( this.offScreen + canvas.height)){// if off bottom of screen
            this.position.y = 0 - this.offScreen;// put back at top of screen
            this.x=Math.random()*canvas.width;// add a bit of variety
        }
        posObj( this );// draw the sprite
    }
}

function playerBullet( x, y, xv, yv, s ){
    this.size = s; // % of canvas width
    this.position = {
        x: x,
        y: y
    };
    this.velocity = {
        z: xv,
        y: yv
    };
    this.angle = 0;
    this.offScreen = pixelSize( s ) / 2; // half sprite height for off screen check in update()
    this.polygons=[
        {
            stroke: 'rgba(20,200,255,0.5)',
            fill: '#aab',
            lineWidth: 0.4,
            shadow: '#14c8ff',
            shadowBlur: 20,
            lineCap: 'round',
            lines:[
                [   270,45,
                    90,45
                ]
            ]
        },{
            stroke: 'rgba(20,200,255,0.5)',
            fill: '#aab',
            lineWidth: 0.28,
            lineCap: 'round',
            lines:[
                [
                    270,44,
                    90,44
                ]
            ]
        },{
            stroke: '#eef',
            fill: '#aab',
            lineWidth: 0.15,
            lineCap: 'round',
            lines:[
                [
                    270,43,
                    90,43
                ]
            ]
        }
    ];
    this.collision = {
        rectangle:[
                260,63,22,100
        ]
    };
    this.update = function (){
        this.position.y += this.velocity.y * gameTime.deltaTime;
        if ( this.position.y < ( 0-this.offScreen ) ) return true;// gone off top of screen
        posObj( this );// draw the sprite
        /*collision check - check this bullet against each enemy*/
        for ( let i = enemies.length - 1; i > -1; i-- ){ //loop backwards to avoid element being missed after splicing
            if ( collision( this, enemies[i] ) ){
                if( enemies[i].hit( true ) ) enemies.splice( i, 1 );// if collisiln call enemy hit and remove from enemies array if hit kills it
                return true;// yep, I'm dead
            }
        }
        return false; //hit nothing and still on screen = alive
    }
}

function explosionCloud(x,y,s){
    this.position = {
        x: x,
        y: y
    };
    this.size = s; // % of canvas width
    this.radius=0; //radius of the cloud
    this.radiusTarget = s / 5 + ( Math.random() * s ) / 3;// what size the cloud will grow to before shrinking
    this.shrink=false;// flag for shrink phase of animation
    this.velocity={
        x: ( Math.random() - 0.5 ) * 2,
        y: -1-Math.random()
    };
    this.delay = gameTime.lastStamp + Math.random() * 300; //delay before start
    this.update = function (){
        if ( gameTime.lastStamp > this.delay){
            if( this.shrink ){
                this.radius -= 0.075;
                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;
                if( this.radius < 0 ) return true; // pfffff - gone
            }else{
                this.radius += 0.3;
                if( this.radius > this.radiusTarget )
                {
                    this.radius = this.radiusTarget;
                    this.shrink+=true;
                }
            }
            var r = pixelSize( this.r );
            context.beginPath();
            context.strokeStyle= '#aaa';
            context.fillStyle= '#eef';
            context.lineWidth = 10 * pixelSize( this.radiusTarget ) / 100;
            context.arc( this.position.x,this.position.y, pixelSize( this.radius ), 0, 2 * Math.PI );
            context.closePath();
            context.stroke();
            context.fill();
        
            return false; // still here!
        }
    }
}

function pickup( x, y, wt ){ //wt=weapon type - 1 guns, 2 speed, 3 shields
    this.position={
        x: x,
        y: y,
        radius: 50
    };
    this.velocity = {
        y: -0.18,
        radius: -0.05
    }
    this.weaponType = wt;
    this.col = (wt == 1) ? '#59c' : ( wt ==2 ) ? '#5c5' : '#b95';// colour
    this.size = 3;
    this.collision={
        circle:[
            0,0,50
        ]
    }

    this.hit = function(){
        var message, col;  // message and colour for the billboard
        switch( this.weaponType ){
            case 1:
            if(player.weapons.guns > 4){
                player.weapons.guns--;
                message = 'Guns Down!';
                col = '255,0,0';
            }else{
                player.weapons.guns++;
                message = 'Guns Up!';
                col = '85,153,204';
            }
            break

            case 2:
            if( player.weapons.speed > 4){
                player.weapons.speed--;
                message = 'Speed Down!';
                col = '255,0,0';
            }else{
                player.weapons.speed++;
                message = 'Speed Up!';
                col = '85,204,85';
            }
            break

            default:
            if( player.weapons.shields > 4){
                player.weapons.shields--;
                message = 'Shields Down!';
                col = '255,0,0';
            }else{
                player.weapons.shields++;
                message = 'Shields Up!';
                col = '187,153,85';
            }
        }
        billboards.push( new billboard( message, col ) );
    }
    this.update = function(){
        let s = pixelSize( this.size ); // save keep calling function (used 3 times)
        /* draw the pickup */
        context.beginPath();
        context.fillStyle = this.col;
        context.shadowColor = this.col;
        context.shadowBlur = 20;
        context.arc( this.position.x, this.position.y, this.position.radius * s / 100, 0, 2 * Math.PI );
        context.closePath();
        context.fill();

        /* pulsate effect: */
        this.position.radius += this.velocity.radius * gameTime.deltaTime;
        if( this.position.radius < 30 ){
            this.position.radius = 30;
            this.velocity.radius*= -1;
        }else if ( this.position.radius > 50){
            this.position.radius = 50;
            this.velocity.radius *= -1;
        }
        this.position.y-= s * this.velocity.y / 100 * gameTime.deltaTime;
        if( this.position.y > canvas.height + s / 2 ) return true; // gone off screen
        if ( collision( player, this )){// colide with player?
            this.hit()// call hit function
            return true;//yes i'm gone
        }
        return false;//still here
    }
}

function billboard( m, cl ){// 'weapon up' billboard
    this.message = m;
    this.col = cl; //colour
    this.alpha = 1;
    this.size = 0.02 * canvas.width;//font size
    this.maxSize = 0.08 * canvas.width;//max font size before commence alpha fade
    this.sizeVel = 0.0001 * canvas.width;//size velocity
    this.update = function(){
        this.size+= this.sizeVel * gameTime.deltaTime;
        if( this.size > this.maxSize )this.alpha-= 0.001 * gameTime.deltaTime;
        if ( this.alpha < 0 ) return true;
        context.fillStyle= 'rgba(' + this.col + ','+this.alpha.toString() + ')';
        context.shadowColor = context.fillStyle;
        context.shadowBlur = this.size * 0.25;
        context.font = Math.round( this.size ).toString() + 'px impact';
        context.textAlign = 'center';
        context.fillText( this.message, canvas.width / 2, canvas.height / 2);
    }
    return false;  
}

function enemyBullet( x, y ){
    this.size = 1;// % of canvas width
    this.position = { x: x,y: y };
    /* to get xv and yv we need angle from spawn location to player position*/
    let adj = Math.abs( player.position.y - y );
    let hyp = Math.sqrt( Math.pow( (player.position.x - x), 2) + Math.pow( ( player.position.y - y ), 2 ) );
    let ang = Math.acos( adj/hyp ) * 180 / Math.PI;
    x < player.position.x ? ang = 90 - ang : ang = 90 + ang; // x velocity left to right or right to left
    this.velocity = {
        x: Math.cos( ang * Math.PI / 180 ) * 0.35,
        y: Math.sin( ang * 0.01745) * 0.35
    };
    this.angle = 90;
    this.offScreen = pixelSize( this.size ) / 2; // half sprite height for off screen check in update()
    this.polygons=[
        {
            stroke: '#a00',
            fill: '#e00',
            arc:[
                [
                    0,0,50,0,6.3
                ]
            ]
        },{
            stroke: '#caa',
            fill: '#fee',
            arc:[
                [
                    0,0,25,0,6.3
                ]
            ]
        },
    ];

    this.collision = {
        circle:[
                0,0,20
        ]
    };
    
    this.update = function (){
       this.position.x+= this.velocity.x * gameTime.deltaTime;
       this.position.y+= this.velocity.y * gameTime.deltaTime;
        if ( this.position.y > ( this.offScreen + canvas.height ) 
        || this.position.y < ( 0 - this.offScreen ) 
        || this.position.x < ( 0 - this.offScreen ) 
        || this.position.x > ( canvas.width + this.offScreen ) ) return true; // off screen so dead
        posObj( this );// draw the sprite
        if ( gameControl.stage == 2 && player.postHit.flag == false && collision( player, this ) ){// if game playing and players post-hit flag is off, do a collision check between this bullet and the player ship
            player.hit();
            return true;
        }
        return false;
    }

}

function straightDownEnemy( cl, y ){ //cl=index of cols[] (purty colour).  y = how high off page to spawn
    this.size=4; //% of canvas width
    this.position = {
        x: Math.random() * canvas.width,
        y: 0 - ( canvas.height * y / 100 ) - ( pixelSize( this.size ) / 2 )
    }
    this.velocity = {
        y: 0.5 + Math.random() / 12,
        x: 0// this is actually an angle so we can do a sin wave for x movement
    }
    this.angle = 180;
    this.polygons = [
        {
            stroke: cols[cl].stroke,
            fill: cols[cl].fill,
            lineWidth: 0.1,
            arc:[
                [
                    270,45,20,0,3.15
                ]
            ]
        },{
            fill: cols[cl].stroke,
            lines:[
                [
                    320,20,
                    280,45,
                    260,45,
                    220,20
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#95a5a6',
            lineWidth: 0.1,
            lines:[
                [
                    300,48,
                    350,50,
                    10,50,
                    60,49,
                    120,49,
                    170,50,
                    190,50,
                    240,48,
                    242,15,
                    298,15
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: cols[cl].stroke,
            lineWidth: 0.02,
            lines:[
                [
                    242,15,
                    200,28,
                    170,50,
                    120,49,
                    60,49,
                    10,50,
                    340,28,
                    298,15
                ]
            ]
        },{
            fill: cols[cl].fill,
            lineWidth: 0.02,
            lines:[
                [
                    242,5,
                    298,5,
                    20,35,
                    60,35,
                    120,35,
                    160,35
                ]
            ]
        },{
            stroke: '#2c3e50',
            fill: '#455a6f',
            lines:[
                [
                    90,25,
                    110,23,
                    130,15,
                    120,10,
                    60,10,
                    50,15,
                    70,23
                ]
            ]
        }
    ]
    this.collision = {
        circle:[
                0,0,45
        ]
    }

    this.hit = function( p ){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        explosion( this.position.x, this.position.y, this.size, p );// make explosion
        return true; // yep, it be dead
    }

    this.update = function (){
        this.position.y+= this.velocity.y * gameTime.deltaTime;
        /* x velocity is just an angle looping round, that we use to make a sin wave */
        this.position.x+= Math.sin( this.velocity.x * Math.PI / 180 ) * 0.5 * gameTime.deltaTime;
        this.velocity.x = (this.velocity.x + 3.5) % 359;
        if( this.position.y > canvas.height + pixelSize( this.size ) ) return true; //gone off screen
        posObj( this );
        if ( gameControl.stage == 2 && player.postHit.flag == false && collision( player, this ) ){// if game playing and players post-hit flag is off, do a collision check between this enemy and the player ship
            player.hit();
            return this.hit( false );
        }
        return false;
    }
}

// O B J E C T    L I T E R A L S
var hud={
    gunIcon:{
        size: 2,
        position: {
            x: canvas.width * 0.9,
            y: canvas.height * 0.15
        },
        update: function(){
            let s = pixelSize( this.size );
            context.beginPath();
            context.fillStyle='#59c';
            context.strokeStyle='#fff';
            context.shadowBlur=0;
            context.lineWidth= s * 8 / 100;
            context.moveTo( this.position.x + 48 * s / 100, this.position.y + 12 * s / 100 );
            context.quadraticCurveTo( this.position.x + s * 50 / 100, this.position.y + 10 * s / 100, this.position.x + 52 * s / 100, this.position.y + s * 12 / 100 );
            context.quadraticCurveTo( this.position.x + 70 * s / 100, this.position.y + 30 * s / 100, this.position.x + 70 * s / 100, this.position.y + 70 * s / 100 );
            context.lineTo( this.position.x + 30 * s / 100, this.position.y + 70 * s / 100 );
            context.quadraticCurveTo( this.position.x + 30 * s / 100, this.position.y + 30 * s / 100, this.position.x + 48 * s / 100, this.position.y + s * 12 / 100 );
            context.moveTo( this.position.x + 70 * s / 100, this.position.y + 80 * s / 100 );
            context.lineTo( this.position.x + s * 70 / 100, this.position.y + s * 90 / 100 );
            context.lineTo( this.position.x + 30 * s / 100, this.position.y + 90 * s / 100 );
            context.lineTo( this.position.x + s * 30 / 100, this.position.y + s * 80 / 100 );
            context.closePath();
            context.stroke();
            context.fill();
            for(let i = 0; i < 5; i++ ){
                context.beginPath();
                context.strokeStyle = '#59c';
                context.shadowColor = '#59c';
                context.rect( this.position.x + s * 30 / 100 + s * 70 / 100 * ( i+1 ), this.position.y + s * 30 / 100, s * 40 / 100, s * 40 / 100);
                context.shadowBlur = ( i < player.weapons.guns) ? 8 : 0;
                if( i < player.weapons.guns )context.fill();
                context.stroke();
                context.closePath();
            }
        }
    },
    speedIcon:{
        size:2,
        position: {
            x: canvas.width * 0.9,
            y: canvas.height * 0.21,
        },
        update: function(){
            let s = pixelSize( this.size );
            context.beginPath();
            context.strokeStyle = '#fff';
            context.lineWidth = s * 8 / 100;
            context.fillStyle = '#5c5';
            context.shadowBlur = 0;
            context.moveTo( this.position.x + 68 * s / 100, this.position.y );
            context.lineTo( this.position.x + s * 30 / 100, this.position.y + s * 44 / 100 );
            context.lineTo( this.position.x + 51 * s / 100, this.position.y + 57 * s / 100 );
            context.lineTo( this.position.x + 20 * s / 100, this.position.y + s );
            context.lineTo( this.position.x + s * 80 / 100, this.position.y + s * 50 / 100 );
            context.lineTo( this.position.x + 57 * s / 100, this.position.y + 38 * s / 100 );
            context.closePath();
            context.stroke()
            context.fill();
            for( let i = 0; i < 5; i++ ){
                context.beginPath();
                context.strokeStyle = '#5c5';
                context.shadowColor = '#5c5';
                context.rect( this.position.x + s * 30 / 100 + s * 70 / 100 * ( i+1 ), this.position.y + s * 30 / 100, s * 40 / 100, s * 40 / 100);
                context.shadowBlur = ( i < player.weapons.speed) ? 8 : 0;
                if( i < player.weapons.speed)context.fill();
                context.stroke();
                context.closePath();
            }
        }
    },
    shieldIcon:{
        size:2,
        position: {
            x: canvas.width * 0.9,
            y: canvas.height * 0.27
        },
        update: function(){
            let s = pixelSize( this.size );
            context.beginPath();
            context.strokeStyle = '#fff';
            context.lineWidth = s * 8 / 100;
            context.fillStyle = '#b95';
            context.shadowBlur = 0;
            context.moveTo( this.position.x + 50 * s / 100, this.position.y + s * 10 / 100 );
            context.quadraticCurveTo( this.position.x + 64 * s / 100, this.position.y + s * 20 / 100, this.position.x + 83 * s / 100, this.position.y + 26 * s / 100 );
            context.lineTo( this.position.x + 83 * s / 100, this.position.y + 37 * s / 100 );
            context.quadraticCurveTo( this.position.x + 71 * s / 100, this.position.y + s * 69 / 100, this.position.x + 50 * s / 100, this.position.y + 89 * s / 100 );
            context.quadraticCurveTo( this.position.x + 29 * s / 100, this.position.y + s * 69 / 100, this.position.x + 17 * s / 100, this.position.y + 37 * s / 100 );
            context.lineTo( this.position.x + 17 * s / 100, this.position.y + 26 * s / 100 );            
            context.quadraticCurveTo( this.position.x + 36 * s / 100, this.position.y + s * 20 / 100, this.position.x + 50 * s / 100, this.position.y + 10 * s / 100 );
            context.closePath();
            context.stroke();
            context.fill();
            for( let i = 0; i < 5; i++ ){
                context.beginPath();
                context.strokeStyle = '#b95';
                context.shadowColor = '#b95';
                context.rect( this.position.x + s * 30 / 100 + s * 70 / 100 * ( i+1 ), this.position.y + s * 30 / 100, s * 40 / 100, s * 40 / 100 );
                context.shadowBlur = ( i <player.weapons.shields ) ? 8 : 0;
                if( i < player.weapons.shields )context.fill();
                context.stroke();
                context.closePath();
            }
        }
    },
    score: {
        size:4, // % of screen width
        update: function(){
            let ps = pixelSize( this.size ); // size in pixels
            context.fillStyle = '#f00';
            context.shadowColor = '#f00';
            context.shadowBlur = ps * 0.05;
            context.font = Math.floor(ps).toString() + 'px impact';
            context.textAlign = 'right';
            context.fillText( 'Score: ' + gameControl.score.toString(), canvas.width - 20, 20 + ps );
        }
    }
}
var player={// player ship
    position: {
        x: canvas.width/2,
        y: canvas.height * 0.92,
    },
    angle: 0,
    size: 8, // % of canvas width
    bulletSpawnPoint:[{a:270,h:54},{a:208,h:50},{a:332,h:50}],// angle and hypotenuse to locate x & y of bullet spawn point
    weapons: {
        guns: 1,
        speed: 0,
        shields: 0
    }, 
    postHit: {
        flag: true,
        time: 0,
        flash: 1, //1=on, -1=off
        flashTime: 0
    },
    bullets: [],
    bulletTime: 0, //time before new bullet can be spawned, releasing spacebar decreases this slightly to reward the not-so-lazy button tappers and to punish the idle button holders :-p
    bulletGap: 600, // gap in milliseconds between bulets, power-ups decrease this                                      
    polygons:[{
            stroke: '#2980b9',
            fill: '#3498db',
            lines:[
                [
                    270,20,
                    350,40,
                    25,35,
                    90,8,
                    155,35,
                    190,40,
                    270,20
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#bdc3c7',
            lines:[
                [
                    348,42,
                    350,45,
                    27,42,
                    26,35
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#bdc3c7',
            lines:[
                [
                    192,42,
                    190,45,
                    153,42,
                    154,35
                ]
            ]
        },{
            stroke: '#7f8c8d',
            fill: '#bdc3c7',
            lines:[
                [
                    267,40,
                    273,40,
                    15,25,
                    75,25,
                    105,25,
                    165,25,
                    267,40
                ]
            ]
        },{
            stroke: '#cdd3d7',
            fill: '#cdd3d7',
            lines:[
                [
                    267,30,
                    273,30,
                    15,15,
                    75,15,
                    105,15,
                    165,15,
                    267,30
                ]
            ]
        },{
            stroke: '#2c3e50',
            fill: '#455a6f',
            lines:[
                [
                    270,16,
                    280,15,
                    16,7,
                    90,5,
                    164,7,
                    260,15
                ]
            ]
        }
    ],
    collision:{
        rectangle:[
            265,40,8,30,
            190,46,90,30
        ]
    },
    engine: function(){
        let s = pixelSize( this.size * ( Math.random() * 0.03 + 0.2 ) );
        let speedBoost = s + player.weapons.speed * 2.5;
        context.beginPath();
        context.fillStyle = '#6ce';
        context.lineWidth = 1;
        context.shadowColor = '#6ce';
        context.shadowBlur = 20;
        context.moveTo( player.position.x, player.position.y + 0.75*s );
        context.quadraticCurveTo( player.position.x + .06 * speedBoost, player.position.y + 1.5 * speedBoost, player.position.x, player.position.y + 2 * speedBoost );
        context.quadraticCurveTo( player.position.x - 0.6 * speedBoost , player.position.y + 1.5 * speedBoost , player.position.x, player.position.y + 0.75*s);
        context.closePath();
        context.fill();
        
        context.beginPath();
        context.fillStyle = '#eef';
        context.lineWidth = 1;
        context.shadowColor = '#eef';
        context.shadowBlur = 20;
        context.moveTo( player.position.x, player.position.y + s );
        context.quadraticCurveTo( player.position.x + 0.25 * speedBoost, player.position.y + 1.4 * speedBoost, player.position.x, player.position.y + 1.8 * speedBoost );
        context.quadraticCurveTo( player.position.x - 0.25 * speedBoost , player.position.y + 1.4 * speedBoost, player.position.x, player.position.y + s);
        context.closePath();
        context.fill();
    },
    hit: function(){// hit taken
        player.weapons.shields--;
        player.postHit.flag = true;
        player.postHit.time = gameTime.lastStamp + 1200;
        if( player.weapons.shields < 0 ){ // if no shields then die
            player.weapons.shields = 0;
            gameControl.stage = 3;// set game controle stage to 3, 'GAME OVER'
            gameControl.stageSize = 0; // 'GAME OVER' text grows in, so starts at 0
            explosion( this.position.x, this.position.y, this.size * 2, false ); // create exlosion at double size of player ship
        }  
    },
    shield: function(){ //draw the shield around the ship
        let s = pixelSize( this.size );
        context.fillStyle = 'rgba(187,153,85,' + player.weapons.shields * 0.1.toString() + ')';
        context.shadowColor = 'b95';
        context.shadowBlur = s * 0.15;;
        context.lineWidth = 0.2 * s;
        context.beginPath();
        context.moveTo( this.position.x - 0.05 * s, this.position.y - 0.5 * s);
        context.quadraticCurveTo( this.position.x, this.position.y- 0.55 * s, this.position.x + 0.05 * s , this.position.y - 0.5 * s );
        context.quadraticCurveTo( this.position.x + 0.15 * s, this.position.y - 0.15 * s, this.position.x + 0.5 * s, this.position.y - 0.15 * s);
        context.quadraticCurveTo( this.position.x + 0.6 * s, this.position.y, this.position.x + 0.45 * s, this.position.y + 0.25 * s );
        context.quadraticCurveTo( this.position.x + 0.2 * s, this.position.y + 0.3 * s, this.position.x + 0.05 * s, this.position.y + 0.45 * s );
        context.lineTo( this.position.x - 0.05 * s, this.position.y + 0.45 * s );
        context.quadraticCurveTo( this.position.x - 0.2 * s, this.position.y + 0.3 * s, this.position.x - 0.45 * s, this.position.y + 0.25 * s );
        context.quadraticCurveTo( this.position.x - 0.6 * s, this.position.y, this.position.x - 0.5 * s, this.position.y - 0.15 * s);
        context.quadraticCurveTo( this.position.x - 0.15 * s, this.position.y - 0.15 * s, this.position.x - 0.05 * s, this.position.y - 0.5 * s );
        context.closePath();
        context.fill();
    },
    update: function(){ // called evry frame by the sync() function.
        let s = pixelSize( this.s );
        //post-hit flash
        if( player.postHit.flag ){ // post hit is when the player is momentarily immune - the ship will flash to indicate in this period
            if( gameTime.lastStamp > player.postHit.time ) player.postHit.flag = false;//postHit immunity is over
            if( gameTime.lastStamp > player.postHit.flashTime ){ // time to flip the flash flag?
                player.postHit.flash*= -1;// invert flag (-1=off, 1==on)
                player.postHit.flashTime = gameTime.lastStamp + 50;//50 milliseconds between on and off makes nice flash
            }
        }                                               
        //Movement
        let speed = ( 0.2 + player.weapons.speed * 0.1 ) * gameTime.deltaTime;
        if ( gameControl.keyPressed.left ){
            this.position.x -= speed;
            if( this.position.x < 0) this.position.x = 0;// stay on screen
        } else if ( gameControl.keyPressed.right ){
            this.position.x += speed;
            if( this.position.x > canvas.width + s / 2) this.position.x = canvas.width + s / 2;// stay on screen
        }
        if( gameControl.keyPressed.up ){
            this.position.y -= speed;
            if(this.position.y < s / 2 ) this.position.y= s / 2;
        }else if( gameControl.keyPressed.down ){
            this.position.y += speed;
            if( this.position.y > canvas.height - s / 2 ) this.position.y = canvas.height - s / 2;
        }
        //shooting
        if ( gameControl.keyPressed.fire && ( gameTime.lastStamp > player.bulletTime ) ){ // fire pressed and the wait time for new bullet passed?
            player.bulletTime = gameTime.lastStamp + player.bulletGap * ( 1 - player.weapons.guns * 0.1 ); // bulletTime for next bullet calculated
            let hyp = 0; // the hypotenuse to calculate bullets spawn point
            let shots = player.weapons.guns; //how many shhots according toplayers gun strength
            if( shots > 3 ) shots = 3; // 3 maximum
            for ( let i = 0; i < shots; i++ ){
                hyp = pixelSize( player.size ) * player.bulletSpawnPoint[i].h / 100;
                player.bullets.push( new playerBullet( 
                    player.position.x + Math.cos( player.bulletSpawnPoint[i].a * Math.PI / 180 ) * hyp, 
                    player.position.y + Math.sin( player.bulletSpawnPoint[i].a * Math.PI / 180 ) * hyp, 
                    0, -0.85, 1.5 ) 
                );
            }
            playSFX( soundFX.playerShot );// play laser shot sound
        }
        
        if( ( (player.postHit.flag) && player.postHit.flash == 1 ) || ( !(player.postHit.flag) )){ // if player is not hit phase, or if he is the flash flag is on(1)
            this.engine()// update and draw engines
            posObj( player );// draw the ship sprite
            if ( this.weapons.shields >= 0) this.shield();// draw shield
        }
    } 
}

var starfield=[];
let yr=canvas.height/8; //distribute evenly on the y
for ( let i = 0; i < 3; i++ ){
    starfield[i] = [];
    for( let j = 0; j < 8; j++){
        starfield[i].push( new star( Math.random() * canvas.width, j * yr, 0.5 * ( i+1 ) ) );
    }
}

window.requestAnimationFrame( sync ); // let the magic begin
