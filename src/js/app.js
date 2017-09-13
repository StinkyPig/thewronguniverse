var v=document.getElementById('c'),c=v.getContext('2d');
v.width=window.innerWidth,v.height=window.innerHeight;
var t={s:0,d:1}; // object for time - s=last timestamp,d=delta movement
var ctrl={l:false,r:false,u:false,d:false,f:false,nws:0,lv:3,sc:0,hs:0,db:false,dbkey:false,bt:0,bg:600,pt:0,np:2,stage:0,gr:1,grt:0,go:0}; /* object to store data for game control:
l: true if left key held down
r: true if right key held down
f: true if fire key held down(space)
nw: next wave index in ew
nws: next wave timestamp
lv: lives
sc:score
debug mode
bt : bullett timestamp
bg: ms between bullets
pt: timestamp for next pickup
np: next pickup
stage: 0= menu 1=get ready 2=play 3=game over in 4=game over wait, 5=game over out
gr: get ready alpha
grt: get ready timer
go: used for size on stage 3, timeron stage 4 and size again on stage 5
*/
var cols=[{b:'#16a085',f:'#1abc9c'},{b:'#27ae60',f:'#2ecc71'},{b:'#2980b9',f:'#3498db'},{b:'#8e44ad',f:'#9b59b6'},{b:'#f39c12',f:'#f1c40f'},{b:'#d35400',f:'#e67e22'},{b:'#c0392b',f:'#e74c3c'}]// some purty colours
var bds=[]; // baddies / enemies
var shot=new Audio();
var exp=new Audio();
shot=document.getElementById('sh');
exp=document.getElementById('ex');




document.addEventListener('keydown',function(e){
    switch (e.which){
        case 37:
        ctrl.l=true;
        break;
        case 39:
        ctrl.r=true;
        break;
        case 38:
        ctrl.u=true;
        break;
        case 40:
        ctrl.d=true;
        break;
        case 32:
        ctrl.f=true;
        //ctrl.dbkey=true;
        break;
    }
});
document.addEventListener('keyup',function(e){
    switch (e.which){
        case 37:
        ctrl.l=false;
        break;
        case 39:
        ctrl.r=false;
        break;
        case 38:
        ctrl.u=false;
        break;
        case 40:
        ctrl.d=false;
        break;
        case 32:
        ctrl.f=false;
        ctrl.bt-=300;
        break;
    }
});
ac={t:0,g:1500}; // astrois controller - t=timestamp for generation g=generation gap




/********************************F U N C T I O N S********************************* */

// turn percentage to pixels of canvas width - p=percentage - returns pixels
function A(p){
    return v.width*p/100;
}

// position object - o=object
function B(o){
    // console.log(ebs[0]);
    var a,h,x,y,i,j=0;// angle, hypotenuse, position x position y - i&j loop counters
    s=A(o.s);
    var fr=0;// animation frame
    for (i=0;i<o.p.length;i++){// loop through polys
        if(o.id){
            c.strokeStyle=(t.s>o.id)?o.p[i].b:'#411';
            c.fillStyle=(t.s>o.id)?o.p[i].f:'#501';
        }else{
            if(o.p[i].b)c.strokeStyle=o.p[i].b;
            if(o.p[i].f)c.fillStyle=o.p[i].f;
        }
        c.lineWidth=(o.p[i].lw)?s*o.p[i].lw:s*.03;
        c.shadowColor=(o.p[i].sh)?o.p[i].sh:'transparent';
        if(o.p[i].sb)c.shadowBlur=s*o.p[i].sb/100;
        c.beginPath();
        c.lineCap=(o.p[i].lc)?o.p[i].lc:'butt';
        if(o.p[i].l){
            fr=(o.f)?(o.af+1>o.p[i].l.length)?0:o.af:0; //get animation frame catching any posible too long error
            for (j=0;j<o.p[i].l[fr].length;j+=2){
                a=(o.a+o.p[i].l[fr][j])/180*Math.PI;
                h=s*o.p[i].l[fr][j+1]/100;
                x=o.x+Math.cos(a)*h;
                y=o.y+Math.sin(a)*h;
                j>0 ? c.lineTo(x,y) : c.moveTo(x,y);
            }
        }
        if(o.p[i].a){
            fr=(o.af+1>o.p[i].a.length)?0:o.af; //get animation frame catching any posible too long error
            for (j=0;j<o.p[i].a[fr].length;j+=5){
                a=(o.a+o.p[i].a[fr][j])/180*Math.PI;
                h=s*o.p[i].a[fr][j+1]/100;
                x=o.x+Math.cos(a)*h;
                y=o.y+Math.sin(a)*h;
                c.arc(x,y,o.p[i].a[fr][j+2]*s/100,o.p[i].a[fr][j+3],o.p[i].a[fr][j+4]);
            }
        }
        c.closePath();
        if(o.p[i].b)c.stroke();
        if(o.p[i].f)c.fill();
    }
    if(ctrl.db){//this bit draws collision boxes and circles if debug flag true        
        if (o.cl){
            c.strokeStyle='green';
            c.lineWidth=1;
            if(o.cl.c){
                for(i=0;i<o.cl.c.length;i+=3){
                    c.beginPath();
                    c.arc(o.x+(s*o.cl.c[i]/100),o.y+(s*o.cl.c[i+1]/100),s*o.cl.c[i+2]/100,0,6.2);
                    c.stroke();
                    c.closePath();

                }
            }
            if(o.cl.r){
                for(i=0;i<o.cl.r.length;i+=4){
                    c.beginPath();
                    c.rect(o.x+Math.cos(o.cl.r[i]*.01745)*s*o.cl.r[i+1]/100,
                        o.y+Math.sin(o.cl.r[i]*.01745)*s*o.cl.r[i+1]/100,
                        s*o.cl.r[i+2]/100,s*o.cl.r[i+3]/100
                        );
                    c.stroke();
                    c.closePath();
                }
            }
        }
    }
}

function C(){//spawn random enemy
    var r=Math.round(Math.random()*10),d=Math.random()*10;
    for (var i=0;i<(pl.wp.g+pl.wp.s+pl.wp.sh);i++){
        if(r<5){
            bds.push(new $c(i*25,d));
        }else{
            cl=Math.floor(Math.random()*6);
            Math.random()<.5?bds.push(new $b(Math.random()*v.width,i*2,cl)):bds.push(new $j(cl,i*50));
        }
    }
}

function E(x,y,s,p){//explosion p=pickup possible?
    for (var i=0;i<25;i++){
        ptc.push(new $f(x+(Math.random()-0.5)*A(s)/2,y+(Math.random()-0.5)*A(s)/2,s));
        if(i<12)ptc.d=0;  // no delay for first dozen
    }
    if(p && t.s>ctrl.pt){
        ctrl.pt=t.s+1200;
        pkp.push(new $g(x,y,ctrl.np));
        ctrl.np=ctrl.np%3+1;
    }
    ctrl.sc++;
    G(exp);
}

function F(o1,o2){
    var x1,y1,x2,y2,r1,r2,w1,w2,h1,h2,dx,dy;
    var s1=A(o1.s),s2=A(o2.s); //size in pixels of each object
    var i,j;//counter index variables
    if (o1.cl.c){
        for(i=0;i<o1.cl.c.length;i+=3){
            x1=o1.x+Math.cos(o1.cl.c[i]*.01745)*s1*o1.cl.c[i+1]/100;// object 1 collision circle's x in pixels
            y1=o1.y+Math.sin(o1.cl.c[i]*.01745)*s1*o1.cl.c[i+1]/100;// object 1 collision circle's y in pixels
            r1=o1.cl.c[i+2]*s1/100;//collision circle's radius in pixels
            if(o2.cl.c){
                for (j=0;j<o2.cl.c.length;j+=3){
                    x2=o2.x+Math.cos(o2.cl.c[j]*.01745)*s2*o2.cl.c[j+1]/100;// object 2 collision circle's x in pixels
                    y2=o2.y+Math.sin(o2.cl.c[j]*.01745)*s2*o2.cl.c[j+1]/100;// object 2 collision circle's y in pixels
                    r2=o2.cl.c[j+2]*s1/100;//collision circle's radius in pixels
                    dx=x1-x2;
                    dy=y1-y2;
                    if((r1+r2)>Math.sqrt(dx*dx+dy*dy)){//if circles's joint radii is greater than the distance between both circle's centre then we have a hit
                        return true;
                    }
                }
            }
            if (o2.cl.r){
                for(j=0;j<o2.cl.r.length;j+=4){
                    x2=o2.x+Math.cos(o2.cl.r[j]*.01745)*s2*o2.cl.r[j+1]/100;
                    y2=o2.x+Math.sin(o2.cl.r[j]*.01745)*s2*o2.cl.r[j+1]/100;
                    w2=s2*o2.cl.r[j+2]/100;
                    h2=s2*o2.cl.r[j+3]/100;
                    if(cr(x2,y2,w2,h2,x1,y1,r1))return true;
                }
            }
        }
    }
    if(o1.cl.r){
        for(i=0;i<o1.cl.r.length;i+=4){
            x1=o1.x+Math.cos(o1.cl.r[i]*.01745)*s1*o1.cl.r[i+1]/100;// obj1 x of collision box
            y1=o1.y+Math.sin(o1.cl.r[i]*.01745)*s1*o1.cl.r[i+1]/100;// obj1 y of collision box
            w1=s1*o1.cl.r[i+2]/100;//obj1 collision box width
            h1=s1*o1.cl.r[i+3]/100;//obj1 collision box height
            if (o2.cl.c){
                for(j=0;j<o2.cl.c.length;j+=3){
                    x2=o2.x+Math.cos(o2.cl.c[j])*s2*o2.cl.c[j+1]/100;//obj2 circle x
                    y2=o2.y+Math.sin(o2.cl.c[j])*s2*o2.cl.c[j+1]/100;//obj2 circle y
                    r2=o2.cl.c[j+2]*s2/100//obj2 circle radius
                    if(cr(x1,y1,w1,h1,x2,y2,r2))return true;
                }
            }
        }
    }
    function cr(rx,ry,rw,rh,cx,cy,cr){//circle-rectangle collision check
        dx=Math.abs(cx-rx-rw/2);
        dy=Math.abs(cy-ry-rh/2);//distance x and dixstance y between centres
        if(dx>(rw/2+cr) || dy>(rh/2+cr)) return false;// can't be colliding
        if(dx<=(rw/2) || dy<=(rh/2)) return true;// definate hit
        dx=dx-rw/2;dy=dy-rh/2;
        return ((cr*cr)>dx*dx+dy*dy); // touching at corner?
    }       
}

function G(e){ // playsound effects
    e.currentTime=0;
    e.play();
}

function S() {// sync - draw frame
    
    //update timer for movement
    var s=Date.now();
    t.s==0 ? t.d=17:t.d=s-t.s;

    //clear last frame
    c.fillStyle='#2c3e50';
    c.fillRect(0,0,v.width,v.height);
    

    for(i=0;i<3;i++){// starfield
        for(var j=0;j<sf[i].length;j++){
            sf[i][j].u();
        }
    }

    if(s >ctrl.nws){ // time to spawn enemy wave?
        ctrl.nws=s+4000;
        C();
    }


    for (i=pkp.length-1;i>-1;i--){ // particles layer1, loop backwards to avoid element being missed after splicing
        if(pkp[i].u()){
            pkp.splice(i,1);
        }
    }

    if (ctrl.stage==2)pl.u();// update player

    for (var i=bds.length-1;i>-1;i--){ // enemies/baddies - loop backwards to avoid element being missed after splicing
        if(bds[i].u()){
            bds.splice(i,1);
        }
    }
    for (i=pl.bts.length-1;i>-1;i--){ // player bullets - loop backwards to avoid element being missed after splicing
        if(pl.bts[i].u()){
            pl.bts.splice(i,1);
        }
    }
    for (i=ptc.length-1;i>-1;i--){ // particle - loop backwards to avoid element being missed after splicing
        if(ptc[i].u()){
            ptc.splice(i,1);
        }
    }
    for (i=ebs.length-1;i>-1;i--){ //enemy bullets, loop backwards to avoid element being missed after splicing
        if(ebs[i].u()){
            ebs.splice(i,1);
        }
    }

    t.s=s;// record current timestamp
    
    if (t.s-ac.t>ac.g){//time for an astroid?
        bds.push(new $a());
        ac.t=t.s;
    }
    for (i=blb.length-1;i>-1;i--){ // billboards, loop backwards to avoid element being missed after splicing
        if(blb[i].u()){
            blb.splice(i,1);
        }
    }
    /* HUD */
    hud.gi.u();
    hud.si.u();
    hud.shi.u();
    hud.scr.u();

    if(ctrl.stage==0){

        c.fillStyle='rgba(0,0,0,.6)';
        c.fillRect(0,0,v.width,v.height);

            c.fillStyle='#34495e';
            c.strokeStyle='#ecf0f1';
            c.shadowBlur=0;
            c.textAlign='center';
            c.font=Math.round(v.width*.1).toString()+'px impact';
            c.strokeText('The Wrong Universe',v.width/2,v.height/3);
            c.fillText('The Wrong Universe',v.width/2,v.height/3);
            c.font=Math.round(v.width*.03).toString()+'px impact';
            c.strokeText('Cursor Keys or WASD to move.',v.width/2,v.height/2);
            c.fillText('Cursor Keys or WASD to move.',v.width/2,v.height/2);
            c.strokeText('Space key to fire',v.width/2,v.height*.6);
            c.fillText('Space key to fire',v.width/2,v.height*.6);
        c.font=Math.round(v.width*.05).toString()+'px impact';
            c.strokeText('Press fire to play',v.width/2,v.height*.8);
            c.fillText('Press fire to play',v.width/2,v.height*.8);

            if(ctrl.f){
                ctrl.stage=1
                ctrl.gr=1;
                ctrl.grt=t.s+1250;
            }
    }
    else if(ctrl.stage==1){
        c.fillStyle='rgba(255,255,255,'+ctrl.gr.toString()+')';
        c.textAlign='center';
        c.font=v.width*.2+'px impact';
        c.fillText('GET READY',v.width/2,v.height/2);
        if(t.s>ctrl.grt)ctrl.gr-=.001*t.d;
        if(ctrl.gr<0)ctrl.stage=2;
    }else if(ctrl.stage==3){
        c.fillStyle='#fff';
        c.textAlign='center';
        c.font=v.width*.2*ctrl.go+'px impact';
        c.fillText('GAME OVER',v.width/2,v.height/2);
        ctrl.go+=0.001*t.d;
        if (ctrl.go>1){
            ctrl.stage=4;
            ctrl.go=t.s+1250;
        }
    }
    else if(ctrl.stage==4){
        c.fillStyle='#fff';
        c.textAlign='center';
        c.font=v.width*.2+'px impact';
        c.fillText('GAME OVER',v.width/2,v.height/2);
        if (t.s>ctrl.go){
            ctrl.stage=5;
            ctrl.go=1
        }
    }else if(ctrl.stage==5){
        c.fillStyle='#fff';
        c.textAlign='center';
        c.font=v.width*.2*ctrl.go+'px impact';
        c.fillText('GAME OVER',v.width/2,v.height/2);
        ctrl.go-=0.0005*t.d;
        if(ctrl.go<0)ctrl.stage=0;

    }
    window.requestAnimationFrame(S); // keep the magic going :)
}



/* the objects/sprites of the game
x: x position of object
y: y position of object
a: angle of object
s: size of object in % - percentage size of canvas width
p:polygons - each object/sprite is made up of outlined and fill polygons drawn on top of each other
p.b: border color of polygons
p.f: fill color of polygons
p.l: array of angles and hypotenuses to plot x,y points of poly's lines.
*/

/* constructer objects*/
function $a(x,y){ // asteroid
    this.s=Math.round(Math.random()*20);  //scale - percentage of screen width
    this.pw=this.s;//power (numer of hits it will take to destroy)
    if(this.s<5) this.s=5; // Minimum size is 5%
    this.x=v.width*Math.random();
    this.y=0-A(this.s)/2; //just off top of screen
    this.a=Math.random()*360; //random starting angle
    this.rs=(25-this.s)*.0025; // rotation speed of asteroid
    this.yv=(25-this.s)*.0125; // y velocity of asteroid
    if (Math.random()>.5)this.rs*=-1; // let's have half of them spin backwards
    this.af=0; // animation frame
    this.id=0;
    this.p=[
        {
            b:'#594231',
            f:'#836049',
            l:[
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
            b:'#997055',
            f:'#997055',
            l:[
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
            b:'#836049',
            f:'#836049',
            l:[
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
            b:'#836049',
            f:'#836049',
            l:[
                [
                    180,35,
                    185,32,
                    180,28,
                    175,34,
                    180,35
                ]
            ]
        },{
            b:'#836049',
            f:'#836049',
            l:[
                [
                    70,15,
                    100,15,
                    110,10,
                    69,5
                ]
            ]
        }
    ]
    this.cl={//collision
        c:[
            0,0,47
        ]
    }

    this.h=function(p){// taken hit p=pickup possible (crashing into ship = no pickup)
        if(this.s<6){
            E(this.x,this.y,this.s,p);
            return true;
        }
        this.s--;
        this.id=t.s+75;
        return false;
    }

    this.u=function (){ // update function
        var die=false;
        this.a+=this.rs*t.d;//rotate astroid
        this.y+=t.d*this.yv;// move it
        B(this);
        if (this.y>A(this.s)/2+v.height) die=true; // if asteroid gone off screen
        if (ctrl.stage==2 && F(pl,this)){
            die=this.h(false);
            pl.h();
        }
        return die;
    }
}

function $b(x,y,cl){// baddie 1
    this.s=5; //scale/size % of canvas width
    this.x=x; //x position
    this.y=0-(v.height*y/100)-(A(s)/2) // y position
    this.v=0.15+Math.random()*.1; // velocity
    this.a=90; // angle
    this.rv=0; // rotation velocity
    this.af=0; // animation frame
    this.p=[
        {
            b:cols[cl].b,
            f:cols[cl].f,
            l:[
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
            f:cols[cl].b,
            l:[
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
            b:'#7f8c8d',
            f:'#95a5a6',
            l:[
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
            b:'#7f8c8d',
            f:'#95a5a6',
            l:[
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
            f:'#bdc3c7',
            l:[
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
            f:'#bdc3c7',
            l:[
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
            b:'#7f8c8d',
            f:'#95a5a6',
            l:[
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
            f:'#bdc3c7',
            l:[
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
            b:'#2c3e50',
            f:'#34495e',
            l:[
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
    this.cl={ //collision
        c:[ // circles
                0,-12,35
        ]
    }

    this.h=function(p){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        E(this.x,this.y,this.s,p);
        return true;
    }

    this.u=function (){ // update function
        var die=false;
        var adj=pl.y-this.y;
        var hyp=Math.sqrt(Math.pow((pl.x-this.x),2)+Math.pow((pl.y-this.y),2));
        var ang=Math.acos(adj/hyp)*180/Math.PI;
        if(pl.x>this.x){
            this.a-=.1*t.d;
            if(this.a<(90-ang))this.a=90-ang;
        }else{
            this.a+=.1*t.d;
            if(this.a>(90+ang))this.a=90+ang;
        }
        if(this.a<50)this.a=50;
        if(this.a>130)this.a=130;
        this.x+=Math.cos(this.a*Math.PI/180)*this.v*t.d;
        this.y+=Math.sin(this.a*Math.PI/180)*this.v*t.d;
        B(this);
        if (this.y>A(this.s)/2+v.height) die=true; // if gone off screen
        if (ctrl.stage==2 && F(pl,this)){
            die=this.h(false);
            pl.h();
        }
        return die;
    }
}

function $c(cfx,dir){// baddie 2
    var xo=v.width*8/100,yo=v.height*8/100;// x,y offsets
    var ratio=v.width/v.height;//ratio screen width/height so we can make tvelocity diagonal corner  to corner
    dir<5?this.cf={x:-xo,y:-yo,xv:.005*ratio,yv:.005,a:cfx}:this.cf={x:v.width+xo,y:-yo,xv:-.005*ratio,yv:.005,a:cfx};//
    //this.cf={x:80,y:80,a:270}; // cf= center of flight - the point the ship is positioned from
    this.s=5; //scale/size % of canvas width
    this.x=0; //x position
    this.y=0; // y position
    //this.yv=     0.1; // y velocity
    //this.xv=0; // x velocity
    this.a=0; // angle
    this.rv=0; // rotation velocity
    this.af=0; // animation frame
    this.bt=t.s+Math.random()*2000;// bullet time
    this.p=[

        {
            b:'688',
            f:'#9aa',
            l:[
                [
                    35,30,
                    15,30,
                    20,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    75,30,
                    45,30,
                    60,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    115,30,
                    85,30,
                    100,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    155,30,
                    125,30,
                    140,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    195,30,
                    165,30,
                    180,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    235,30,
                    205,30,
                    220,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    275,30,
                    245,30,
                    260,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    315,30,
                    285,30,
                    300,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    355,30,
                    325,30,
                    340,48
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
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
            b:'#688',
            f:'#9aa',
            l:[
                [
                    345,30,
                    15,30,
                    0,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    305,30,
                    335,30,
                    320,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    265,30,
                    295,30,
                    280,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    225,30,
                    255,30,
                    240,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    185,30,
                    215,30,
                    200,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    145,30,
                    175,30,
                    160,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    105,30,
                    135,30,
                    120,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    65,30,
                    95,30,
                    80,50
                ]
            ]
        },{
            b:'#688',
            f:'#9aa',
            l:[
                [
                    25,30,
                    55,30,
                    40,50
                ]
            ]
        },{
            b:'#688',
            f:'#eef',
            a:[
                [
                    0,0,20,0,6.3
                ]
            ]
        },{
            b:'#038',
            f:'#159',
            sh:'#222',
            sb:5,
            a:[
                [
                    0,0,10,0,6.3
                ]
            ]
        },{
            f:'#38d',
            a:[
                [
                    0,0,6,0,6.3
                ]
            ]
        },{
            f:'#001',
            a:[
                [
                    0,0,4,0,6.3
                ]
            ]
        }
    ]
    this.cl={ //collision
        c:[ // circles
                0,0,45
        ]
    }

    this.h=function(p){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        E(this.x,this.y,this.s,p);
        return true;
    }

    this.u=function (){ // update function
        var die=false;
        for (var x=0;x<9;x++){
            for(var y=0;y<5;y+=2){
                this.p[x].l[0][y]+=.1*t.d;
                this.p[x+10].l[0][y]-=.1*t.d;
            }
        }
        var adj=pl.y-this.y;
        var hyp=Math.sqrt(Math.pow((pl.x-this.x),2)+Math.pow((pl.y-this.y),2));
        var ang=Math.acos(adj/hyp)*180/Math.PI;
        for(x=20;x<23;x++){
            this.p[x].a[0][0]=(pl.x>this.x)?90-ang:90+ang;
            this.p[x].a[0][1]=10;
        }
        if(t.s>this.bt){
            ebs.push(new $i(this.x,this.y));
            this.bt=t.s+(3500+Math.random()*4000)-((pl.wp.g+pl.wp.s+pl.wp.sh)*200);
        }
        this.cf.x+=A(this.cf.xv)*t.d;
        this.cf.y+=A(this.cf.yv)*t.d;
        this.cf.a+=0.2*t.d;
        this.x=this.cf.x+Math.cos(this.cf.a*Math.PI/180)*150;
        this.y=this.cf.y+Math.sin(this.cf.a*Math.PI/180)*150;
        B(this);
        if (this.y>A(this.s)/2+v.height) die=true; // if gone off screen
        if (ctrl.stage==2 && F(pl,this)){
            die=this.h(false);
            pl.h();
        }
        return die;
    }
}

function $d(x,y,s){// star
    this.s=s; //scale/size % of canvas width
    this.x=x; //x position
    this.y=y; // y position
    this.yv=.6*s; // y velocity
    this.a=0; // alpha
    this.os=A(s)/2; // half sprite height for off screen check in u()
    this.p=[
        {
            f:'#aab',
            l:[
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
            f:'#aab',
            l:[
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
    this.u=function (){ // update function
        this.y+=this.yv;
        if (this.y>(this.os+v.height)){
            this.y=0-this.os;
            this.x=Math.random()*v.width;
        }
        B(this);
    }
}

function $e(x,y,xv,yv,s){// playerbullet
    this.s=s; //scale/size % of canvas width
    this.x=x; //x position
    this.y=y; // y position
    this.yv=yv; // y velocity
    this.xv=xv; // x velocity
    this.a=0; // angle
    this.os=A(s)/2; // half sprite height for off screen check in u()
    this.p=[
        {
            b:'rgba(20,200,255,0.5)',
            f:'#aab',
            lw:.4,
            sh:'#14c8ff',
            sb:20,
            lc:'round',
            l:[
                [   270,45,
                    90,45
                ]
            ]
        },{
            b:'rgba(20,200,255,.5)',
            f:'#aab',
            lw:.28,
            lc:'round',
            l:[
                [
                    270,44,
                    90,44
                ]
            ]
        },{
            b:'#eef',
            f:'#aab',
            lw:.15,
            lc:'round',
            l:[
                [
                    270,43,
                    90,43
                ]
            ]
        }
    ]
    this.cl={ //collision
        r:[
                260,63,22,100
        ]
    }
    this.u=function (){ // update function
        var die=false;
        this.y+=this.yv*t.d;
        this.x+=this.xv;
        if (this.y<(0-this.os)) die=true;
        B(this);
        /*collision check*/
        for (var i=bds.length-1;i>-1;i--){ //loop backwards to avoid element being missed after splicing
            if (F(this,bds[i])){
                die=true;
                if(bds[i].h(true))bds.splice(i,1);
            }
        }
        return die;
    }
}

function $f(x,y,s){// explotsion
    this.x=x;
    this.y=y;
    this.s; //scale/size % of canvas width
    this.r=0;
    this.rt=s/5+(Math.random()*s)/3;
    this.sh=false;// flag for shrink phase of animation
    this.xv=(Math.random()-0.5)*2//x velocity
    this.yv=0-1-Math.random();//y velocity
    this.d=t.s+Math.random()*300; //delay before start
    this.u=function (){ // update function
        if (t.s>this.d){
            var die=false;
            if(this.sh){
                this.r-=0.075;
                this.x+=this.xv;
                this.y+=this.yv;
                if(this.r<0){
                    this.r=0;
                    die=true;
                }
            }else{
                this.r+=.3;
                if(this.r>this.rt)
                {
                    this.r=this.rt;
                    this.sh+=true;
                }
            }
            var r=A(this.r);
            c.beginPath();
            c.strokeStyle='#aaa';
            c.fillStyle='#eef';
            c.lineWidth=10*A(this.rt)/100;
            c.arc(this.x,this.y,r,0,6.28);
            c.closePath();
            c.stroke();
            c.fill();
        
            return die;
        }
    }
}

function $g(x,y,tw){ //pickup
    this.x=x;
    this.y=y;
    this.yv=-.18;
    this.tw=tw;// type of weapon pickup effects
    this.c=(tw==1)?'#59c':(tw==2)?'#5c5':'#b95';
    this.s=3;
    this.r=50;
    this.rv=-.05;
    this.cl={//collision
        c:[
            0,0,50
        ]
    }
    this.h =function(){
        var m='',c='';
        switch(this.tw){
            case 1:
            if(pl.wp.g>4){
                pl.wp.g--;
                m='Guns Down!';
                c='255,0,0';
            }else{
                pl.wp.g++;
                m='Guns Up!';
                c='85,153,204';
            }
            break

            case 2:
            if(pl.wp.s>4){
                pl.wp.s--;
                m='Speed Down!';
                c='255,0,0';
            }else{
                pl.wp.s++;
                m='Speed Up!';
                c='85,204,85';
            }
            break

            default:
            if(pl.wp.sh>4){
                pl.wp.sh--;
                m='Shields Down!';
                c='255,0,0';
            }else{
                pl.wp.sh++;
                m='Shields Up!';
                c='187,153,85';
            }
        }
        blb.push(new $h(m,c));
    }
    this.u=function(){
        var s=A(this.s),die=false;
        c.beginPath();
        c.fillStyle=this.c;
        c.shadowColor=this.c;
        c.shadowBlur=20;
        c.arc(this.x,this.y,this.r*s/100,0,6.28);
        c.closePath();
        c.fill();
        this.r+=this.rv*t.d;
        if(this.r<30){
            this.r=30;
            this.rv*=-1;
        }else if (this.r>50){
            this.r=50;
            this.rv*=-1;
        }
        this.y-=s*this.yv*t.d/100;
        if(this.y>v.height+s/2)die=true;
        if (F(pl,this)){
            die=true;
            this.h()
        }
        return die;
    }
}

function $h(m,cl){// weapons billboard
    this.m=m; //message
    this.c=cl; //colour
    this.a=1; // alpha
    this.s=30//.02*v.width;//font size
    this.ms=.08*v.width;//max font size before commence alpha fade
    this.sv=.0001*v.width;//size velocity
    this.u=function(){
        this.s+=this.sv*t.d;
        if(this.s>this.ms)this.a-=.001*t.d;
        if (this.a<0)return true;
        c.fillStyle='rgba('+this.c+','+this.a.toString()+')';
        c.shadowColor=c.fillStyle;
        c.shadowBlur=s*.25;
        c.font=Math.round(this.s).toString()+'px impact';
        c.textAlign='center'
        c.fillText(this.m,v.width/2,v.height/2);
    }
    return false;  
}

function $i(x,y){ // enemy bullit
    this.s=1;//v.width/100; //scale/size % of canvas width
    this.x=x; //x position
    this.y=y;//y; // y position

    /* to get xv and yv we need angle from spawn location to player position*/
    var adj=Math.abs(pl.y-y);
    var hyp=Math.sqrt(Math.pow((pl.x-x),2)+Math.pow((pl.y-y),2));
    var ang=Math.acos(adj/hyp)*180/Math.PI;
    x<pl.x?ang=90-ang:ang=90+ang; // x velocity
    this.xv=Math.cos(ang*.01745)*.35;//x velocity
    this.yv=Math.sin(ang*.01745)*.35; // y velocity
    this.a=90;
    this.os=A(this.s)/2; // half sprite height for off screen check in u()
    this.af=0;
    this.p=[
        {
            b:'#a00',
            f:'#e00',
            a:[
                [
                    0,0,50,0,6.3
                ]
            ]
        },{
            b:'#caa',
            f:'#fee',
            a:[
                [
                    0,0,25,0,6.3
                ]
            ]
        },
    ];

    this.cl={ //collision
        c:[
                0,0,20
        ]
    }
    this.u=function (){ // update function
       this.x+=this.xv*t.d;
       this.y+=this.yv*t.d;
        if (this.y>(this.os+v.height) || this.y<(0-this.os) || this.x<(0-this.os) || this.x>(v.width+this.os)){
             return true;
        }
        B(this);
        if (ctrl.stage==2 && F(pl,this)){
            pl.h();
            return true;
        }
        return false;
    }

}

function $j(cl,y){// baddie 3
    this.s=4; //scale/size % of canvas width
    this.x=Math.random()*v.width; //x position
    this.y=0-(v.height*y/100)-(A(s)/2) // y position
    this.yv=5+Math.random()*5; // velocity
    this.xv=0;// this is actually an angle so we can do a sin wave for x movement
    this.a=180; // angle
    this.af=0; // animation frame
    this.p=[
        {
            b:cols[cl].b,
            f:cols[cl].f,
            lw:.1,
            a:[
                [
                    270,45,20,0,3.15
                ]
            ]
        },{
            f:cols[cl].b,
            l:[
                [
                    320,20,
                    280,45,
                    260,45,
                    220,20
                ]
            ]
        },{
            b:'#7f8c8d',
            f:'#95a5a6',
            lw:.1,
            l:[
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
            b:'#7f8c8d',
            f:cols[cl].b,
            lw:.02,
            l:[
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
            f:cols[cl].f,
            lw:.02,
            l:[
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
            b:'#2c3e50',
            f:'#455a6f',
            l:[
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
    this.cl={ //collision
        c:[ // circles
                0,0,45
        ]
    }

    this.h=function(p){// hit taken function - p=pickup possible?(no pickup when crash into ship)
        E(this.x,this.y,this.s,p);
        return true;
    }

    this.u=function (){ // update function
        var die=false;
        this.y+=this.yv;
        if(this.y>v.height+A(this.s))die=true;
        B(this);
        if (this.y>A(this.s)/2+v.height) die=true; // if gone off screen
        if (ctrl.stage==2 && F(pl,this)){
            die=this.h(false);
            pl.h();
        }
        return die;
    }
}
// O B J E C T    L I T E R A L S
var hud={
    gi:{// gun icon
        s:2,
        x:v.width*.9,
        y:v.height*.15,
        u:function(){
            var s=A(this.s);
            c.beginPath();
            c.fillStyle='#59c';
            c.strokeStyle='#fff';
            c.shadowBlur=0;
            c.lineWidth=s*8/100;
            c.moveTo(this.x+48*s/100,this.y+12*s/100);
            c.quadraticCurveTo(this.x+s*50/100,this.y+10*s/100,this.x+52*s/100,this.y+s*12/100);
            c.quadraticCurveTo(this.x+70*s/100,this.y+30*s/100,this.x+70*s/100,this.y+70*s/100);
            c.lineTo(this.x+30*s/100,this.y+70*s/100);
            c.quadraticCurveTo(this.x+30*s/100,this.y+30*s/100,this.x+48*s/100,this.y+s*12/100);
            c.moveTo(this.x+70*s/100,this.y+80*s/100);
            c.lineTo(this.x+s*70/100,this.y+s*90/100);
            c.lineTo(this.x+30*s/100,this.y+90*s/100);
            c.lineTo(this.x+s*30/100,this.y+s*80/100);
            c.closePath();
            c.stroke();
            c.fill();
            for(var x=0;x<5;x++){
                c.beginPath();
                c.strokeStyle='#59c';
                c.shadowColor='#59c';
                c.rect(this.x+s*30/100+s*70/100*(x+1),this.y+s*30/100,s*40/100,s*40/100);
                c.shadowBlur=(x<pl.wp.g)?8:0;
                if(x<pl.wp.g)c.fill();
                c.stroke();
                c.closePath();
            }
        }
    },
    si:{// speed icon
        s:2,
        x:v.width*.9,
        y:v.height*.21,
        u:function(){
            var s=A(this.s);
            c.beginPath();
            c.strokeStyle='#fff';
            c.lineWidth=s*8/100;
            c.fillStyle='#5c5';
            c.shadowBlur=0;
            c.moveTo(this.x+68*s/100,this.y);
            c.lineTo(this.x+s*30/100,this.y+s*44/100);
            c.lineTo(this.x+51*s/100,this.y+57*s/100);
            c.lineTo(this.x+20*s/100,this.y+s);
            c.lineTo(this.x+s*80/100,this.y+s*50/100);
            c.lineTo(this.x+57*s/100,this.y+38*s/100);
            c.closePath();
            c.stroke()
            c.fill();
            for(var x=0;x<5;x++){
                c.beginPath();
                c.strokeStyle='#5c5';
                c.shadowColor='#5c5';
                c.rect(this.x+s*30/100+s*70/100*(x+1),this.y+s*30/100,s*40/100,s*40/100);
                c.shadowBlur=(x<pl.wp.s)?8:0;
                if(x<pl.wp.s)c.fill();
                c.stroke();
                c.closePath();
            }
        }
    },
    shi:{// shield icon
        s:2,
        x:v.width*.9,
        y:v.height*.27,
        u:function(){
            var s=A(this.s);
            c.beginPath();
            c.strokeStyle='#fff';
            c.lineWidth=s*8/100;
            c.fillStyle='#b95';
            c.shadowBlur=0;
            c.moveTo(this.x+50*s/100,this.y+s*10/100);
            c.quadraticCurveTo(this.x+64*s/100,this.y+s*20/100,this.x+83*s/100,this.y+26*s/100);
            c.lineTo(this.x+83*s/100,this.y+37*s/100);
            c.quadraticCurveTo(this.x+71*s/100,this.y+s*69/100,this.x+50*s/100,this.y+89*s/100);
            c.quadraticCurveTo(this.x+29*s/100,this.y+s*69/100,this.x+17*s/100,this.y+37*s/100);
            c.lineTo(this.x+17*s/100,this.y+26*s/100);            
            c.quadraticCurveTo(this.x+36*s/100,this.y+s*20/100,this.x+50*s/100,this.y+10*s/100);
            c.closePath();
            c.stroke();
            c.fill();
            for(var x=0;x<5;x++){
                c.beginPath();
                c.strokeStyle='#b95';
                c.shadowColor='#b95';
                c.rect(this.x+s*30/100+s*70/100*(x+1),this.y+s*30/100,s*40/100,s*40/100);
                c.shadowBlur=(x<pl.wp.sh)?8:0;
                if(x<pl.wp.sh)c.fill();
                c.stroke();
                c.closePath();
            }
        }
    },
    scr:{// score
        s:4, // size = % of screen width
        u:function(){
            var ps=A(this.s); // size in pixels
            c.fillStyle='#f00';
            c.shadowColor='#f00';
            c.shadowBlur=ps*.05;
            c.font=Math.round(ps).toString()+'px impact';
            console.log(s);
            c.textAlign='right';
            c.fillText('Score: '+ctrl.sc,v.width-20,20+ps);
        }
    }
}
var pl={// player ship
    x:v.width/2,
    y:v.height*.92,
    a:0, //angle,
    s:8, //scale/size
    af:0, //animation frame
    bsp:[{a:270,h:54},{a:208,h:50},{a:332,h:50}], //bulllet spawn points
    wp:{g:1,s:0,sh:0}, // weapons - g=gun, s=speed,sh-shields
    bts:[], // bullets
    p:[{  // layers/polygons
            b:'#2980b9',
            f:'#3498db',
            l:[
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
            b:'#7f8c8d',
            f:'#bdc3c7',
            l:[
                [
                    348,42,
                    350,45,
                    27,42,
                    26,35
                ]
            ]
        },{
            b:'#7f8c8d',
            f:'#bdc3c7',
            l:[
                [
                    192,42,
                    190,45,
                    153,42,
                    154,35
                ]
            ]
        },{
            b:'#7f8c8d',
            f:'#bdc3c7',
            l:[
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
            b:'#cdd3d7',
            f:'#cdd3d7',
            l:[
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
            b:'#2c3e50',
            f:'#455a6f',
            l:[
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
    cl:{
        r:[
            265,40,8,30,
            190,46,90,30
        ]
    },
    e: function(){//engine
        var x=this.x,y=this.y,s=A(this.s*(Math.random()*.03+.2)),fs=s+pl.wp.s*2.5;
        c.beginPath();
        c.fillStyle='#6ce';
        c.lineWidth=1;
        c.shadowColor='#6ce';
        c.shadowBlur=20;
        c.moveTo(x,y+.75*s);
        c.quadraticCurveTo(x+.6*fs,y+1.5*fs,x,y+2*fs);
        c.quadraticCurveTo(x-.6*fs,y+1.5*fs,x,y+.75*s);
        c.closePath();
        c.fill();
        
        c.beginPath();
        c.fillStyle='#eef';
        c.lineWidth=1;
        c.shadowColor='#eef';
        c.shadowBlur=20;
        c.moveTo(x,y+s);
        c.quadraticCurveTo(x+.25*fs,y+1.4*fs,x,y+1.8*fs);
        c.quadraticCurveTo(x-.25*fs,y+1.4*fs,x,y+s);
        c.closePath();
        c.fill();
    },
    h:function(){// hit taken
        pl.wp.sh--;
        if(pl.wp.sh<0){
            pl.wp.sh=0;
            ctrl.stage=3;
            ctrl.go=0;
            E(this.x,this.y,this.s*2,false);
        }
    },
    sh:function(){
        var s=A(this.s),x=this.x,y=this.y;
        c.fillStyle='rgba(187,153,85,'+pl.wp.sh*.1.toString()+')';
        c.shadowColor='b95';
        c.shadowBlur=s*.15;;
        c.lineWidth=.2*s;
        c.beginPath();
        c.moveTo(x-.05*s,y-.5*s);
        c.quadraticCurveTo(x,y-.55*s,x+.05*s,y-.5*s);
        c.quadraticCurveTo(x+.15*s,y-.15*s,x+.5*s,y-.15*s);
        c.quadraticCurveTo(x+.6*s,y,x+.45*s,y+.25*s);
        c.quadraticCurveTo(x+.2*s,y+.3*s,x+.05*s,y+.45*s);
        c.lineTo(x-.05*s,y+.45*s);
        c.quadraticCurveTo(x-.2*s,y+.3*s,x-.45*s,y+.25*s);
        c.quadraticCurveTo(x-.6*s,y,x-.5*s,y-.15*s);
        c.quadraticCurveTo(x-.15*s,y-.15*s,x-.05*s,y-.5*s);
        c.closePath();
        c.fill();
    },
    u: function(){
        var s=A(this.s);
        //Movement
        if(ctrl.l){
            this.x-=(.2+pl.wp.s*.1)*t.d;
            if(this.x<0)this.x=0;
        }else if(ctrl.r){
            this.x+=(.2+pl.wp.s*.1)*t.d;
            if(this.x>v.width+s/2)this.x=v.width+s/2;
        }
        if(ctrl.u){
            this.y-=(.2+pl.wp.s*.1)*t.d;
            if(this.y<s/2)this.y=s/2;
        }else if(ctrl.d){
            this.y+=(.2+pl.wp.s*.1)*t.d;
            if(this.y>v.height-s/2)this.y=v.height-s/2;
        }
        //shooting
        if (ctrl.f && (t.s>ctrl.bt)){
            ctrl.bt=t.s+ctrl.bg*(1-pl.wp.g*.1);
            var h=0;shts=pl.wp.g;
            if(shts>3)shts=3;
            for (var x=0;x<shts;x++){
                h=A(pl.s)*pl.bsp[x].h/100;
                pl.bts.push(new $e(pl.x+Math.cos(pl.bsp[x].a*.01745)*h,pl.y+Math.sin(pl.bsp[x].a*.01745)*h,0,-.85,1.5));
            }
            G(shot);
        }
        this.e()//engines
        B(pl);
        if (this.wp.sh>=0)this.sh();
    } 
}


/* the game loop*/
var sf=[];//star field
var yr=v.height/8;
for (var x=0;x<3;x++){
    sf[x]=[];
    for(var y=0;y<8;y++){
        sf[x].push(new $d(Math.random()*v.width,y*yr,.5*(x+1)));
    }
}
var ptc=[]; // particles
var pkp=[]; //pickups
var blb=[]; //billboards
var ebs=[]; // enemy bullets
window.requestAnimationFrame(S);
