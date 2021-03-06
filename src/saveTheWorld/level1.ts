declare var Phaser:any;
declare var IterableIterator:any;

// imports must be added in gulpFile as well
//removeIf(gameBuild)
import {PHASER_MASTER} from './../exports/master'
import {PHASER_CONTROLS} from './../exports/controller'
import {PHASER_MOUSE} from './../exports/mouse'
import {PHASER_AUDIO} from './../exports/audio'
import {PHASER_PRELOADER} from './../exports/preloader'
import {PHASER_SPRITE_MANAGER} from './../exports/spriteManager'
import {PHASER_TEXT_MANAGER} from './../exports/textManager'
import {PHASER_BUTTON_MANAGER} from './../exports/buttonManager'
import {PHASER_BITMAPDATA_MANAGER} from './../exports/bitmapdataManager'
import {PHASER_GROUP_MANAGER} from './../exports/groupManager'

import {WEAPON_MANAGER} from './required/weaponManager'
import {ENEMY_MANAGER} from './required/enemyManager'
import {EFFECTS_MANAGER} from './required/effectsManager'
import {PLAYER_MANAGER} from './required/playerManager'
import {ITEMSPAWN_MANAGER} from './required/itemspawnManager'
import {UTILITY_MANAGER} from './required/utilityManager'
import {DIALOG_MANAGER} from './required/dialogSequencer'
//endRemoveIf(gameBuild)

class PhaserGameObject {
    // this properties
    global:any;
    game:any;
    devMode: any
    /******************/
    constructor(){
      // accessible in gameObject as _this, accessible in class functions as this (obviously)
      this.game = null;
      this.global = {
        pause: false
      };
      this.devMode = {
        skip: {
          intro: true
        }
      }
    }
    /******************/

    /******************/
    public init(el:any, parent:any, options:any){

      /******************/
      // declare variables BOILERPLATE
      // initiate control class
      let game = new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update});
          game.preserveDrawingBuffer = true;
 
      const phaserMaster = new PHASER_MASTER({game: game, element: el, resolution: {w: options.width, h: options.height}}),
            phaserControls = new PHASER_CONTROLS(),
            phaserMouse = new PHASER_MOUSE({showDebugger: false}),
            phaserSprites = new PHASER_SPRITE_MANAGER(),
            phaserBmd = new PHASER_BITMAPDATA_MANAGER(),
            phaserTexts = new PHASER_TEXT_MANAGER(),
            phaserButtons = new PHASER_BUTTON_MANAGER(),
            phaserGroup = new PHASER_GROUP_MANAGER(),
            phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(),
            effectsManager = new EFFECTS_MANAGER(),
            weaponManager = new WEAPON_MANAGER(),
            enemyManager = new ENEMY_MANAGER({showHitbox: false}),
            playerManager = new PLAYER_MANAGER(),
            itemManager = new ITEMSPAWN_MANAGER(),
            utilityManager = new UTILITY_MANAGER(),
            dialogManager = new DIALOG_MANAGER();

      const store = options.store;
      let gameDataCopy = JSON.stringify(store.getters._gameData());
      phaserMaster.let('gameData', JSON.parse(gameDataCopy))
      /******************/

      /******************/
      function saveData(prop:string, value:any){
        let gameData = phaserMaster.get('gameData')
          gameData[prop] = value;
      }

      /******************/
      function updateStore(){
        // save all data to store
        let gameData = phaserMaster.get('gameData')
        store.commit('setGamedata', gameData)
      }
      /******************/

      /******************/
      function toggleFullscreen(){
            // Maintain aspect ratio
            game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
            // if game is full screen
            if (game.scale.isFullScreen) {
                // turn it off
                game.scale.stopFullScreen();
            } else {
                // else turn it on
                game.scale.startFullScreen(false);
            }
      }
      /******************/

      /******************/
      function preload(){
        let game = phaserMaster.game();

        // set game boundaries
        game.world.setBounds(0, 0, game.canvas.width + 100, game.canvas.height);


        // load resources in parellel
        game.load.enableParallel = true;

        // set canvas color
        game.stage.backgroundColor = '#000000';

        // images
        let folder = 'src/phaser/saveTheWorld/resources'
        game.load.atlas('atlas_main', `${folder}/textureAtlas/main/main.png`, `${folder}/textureAtlas/main/main.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_weapons', `${folder}/textureAtlas/weapons/weaponsAtlas.png`, `${folder}/textureAtlas/weapons/weaponsAtlas.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_large', `${folder}/textureAtlas/large/large.png`, `${folder}/textureAtlas/large/large.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_enemies', `${folder}/textureAtlas/enemies/enemies.png`, `${folder}/textureAtlas/enemies/enemies.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_ships', `${folder}/textureAtlas/ships/ships.png`, `${folder}/textureAtlas/ships/ships.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.atlas('atlas_letters', `${folder}/textureAtlas/letters/letters.png`, `${folder}/textureAtlas/letters/letters.json`, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

        // load music into buffer
        game.load.audio('music-main', [`${folder}/music/level1.mp3`]);
        // game.load.audio('powerupfx', ['src/assets/game/demo1/sound/Powerup4.ogg']);
        // game.load.audio('select', ['src/assets/game/demo1/sound/Pickup_Coin.ogg']);
        // game.load.audio('smallExplosion', ['src/assets/game/demo1/sound/quietExplosion.ogg'])
        // game.load.audio('bigExplosion', ['src/assets/game/demo1/sound/Explosion3.ogg'])
        // game.load.audio('laser', ['src/assets/game/demo1/sound/Laser_Shoot78.ogg'])
        // game.load.audio('hit', ['src/assets/game/demo1/sound/Hit_Hurt11.ogg'])
  
        // json
        game.load.json('weaponData', `${folder}/json/weaponData.json`);

        // font
        game.load.bitmapFont('gem', `${folder}/fonts/gem.png`, `${folder}/fonts/gem.xml`);

        // change state
        phaserMaster.changeState('PRELOAD')

        // send to preloader class
        new PHASER_PRELOADER({game: game, delayInSeconds: 0, done: () => {preloadComplete()}})
      }
      /******************/

      /******************/
      function create(){
        let game = phaserMaster.game();
        let gameData = phaserMaster.get('gameData')
            game.physics.startSystem(Phaser.Physics.ARCADE);

        // assign game to classes
        phaserControls.assign(game)
        phaserMouse.assign(game)
        phaserSprites.assign(game)
        phaserBmd.assign(game)
        phaserTexts.assign(game)
        phaserButtons.assign(game)
        phaserGroup.assign(game, 20)
        phaserBitmapdata.assign(game)
        effectsManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_weapons')
        weaponManager.assign(game, phaserMaster, phaserSprites, phaserGroup, effectsManager, 'atlas_weapons')
        itemManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_main')
        enemyManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, weaponManager, effectsManager, 'atlas_enemies', 'atlas_weapons')
        playerManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, effectsManager, 'atlas_ships', 'atlas_weapons')
        utilityManager.assign(game, phaserMaster, phaserSprites, phaserBitmapdata, phaserGroup, 'atlas_main')
        dialogManager.assign(game, phaserMaster, phaserSprites, phaserGroup, phaserTexts, phaserControls, 'atlas_main')

        const dialogPortraits = {
          PLAYER: 'ui_portrait_1',
          MOTHERSHIP: 'ui_portrait_2',
          STATIC: 'ui_portrait_4',
          BOSS: 'ui_portrait_3'
        }

        const layerDefinitions = {
          BACKGROUND_0: 0,
          BACKGROUND_1: 1,
          ENEMIES_UNDER: 2,
          ENEMIES: 3,
          ENEMIES_OVER: 4,

          ENEMY_BULLETS: 5,
          PLAYER_BULLETS: 5,

          PLAYER_UNDER: 5,
          PLAYER: 6,
          PLAYER_OVER: 7,

          DEBRIS: 7,
          VISUALS: 8,
          BULLET_IMPACT: 8,
          SPECIAL_WEAPON: 9,
          ITEMDROPS: 10,

          FOREGROUND_0: 11,
          FOREGROUND_1: 12,

          DIALOGBOX: 13,
          UI: 14,
          OVERLAY: 20
        }

        // game variables
        phaserMaster.let('roundTime', 60)
        phaserMaster.let('clock', game.time.create(false))
        phaserMaster.let('elapsedTime', 0)
        phaserMaster.let('inGameSeconds', 0)
        phaserMaster.let('devMode', false)
        phaserMaster.let('starMomentum', {x: 0, y:0})
        phaserMaster.let('pauseStatus', false)
        phaserMaster.let('bossHealth', null)
        phaserMaster.let('powerupTimer', 0)
        phaserMaster.let('bossMode', false)           // turn on for when the boss is available
        phaserMaster.let('showWarningBand', false)    // turn on to show warning band
        phaserMaster.let('layers', layerDefinitions)
        phaserMaster.let('dialogPortraits', dialogPortraits)
        phaserMaster.let('sharedDebris', effectsManager.debris(200))
        phaserMaster.let('velocityFactor', {x: 0, y: 1})

        // weapon data
        let weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
        let pw = phaserMaster.let('primaryWeapon', weaponData.primaryWeapons[gameData.primaryWeapon])
        let sw = phaserMaster.let('secondaryWeapon', weaponData.secondaryWeapons[gameData.secondaryWeapon])
        let perk = phaserMaster.let('perk', weaponData.perks[gameData.perk])

        // create dialogbox
        dialogManager.create();

        // pause behavior
        game.onPause.add(() => {
          pauseGame()
        }, this);
        game.onResume.add(() => {
          game.time.addToPausedTime(game.time.pauseDuration )
          unpauseGame();
        }, this);

        //  FIXED CAMERA
        let UI = phaserGroup.layer(layerDefinitions.UI)
        UI.fixedToCamera = true;
        UI.cameraOffset.setTo(0, 0);

        let DB = phaserGroup.layer(layerDefinitions.DIALOGBOX)
        DB.fixedToCamera = true;
        DB.cameraOffset.setTo(0, 0);

        buildTransitionScreen()
        buildBackground()
        buildScoreAndScrap()
        buildMenuAndButtons();
        buildBossWarning();
        buildMothership()

        buildHealthbar_player()
        buildPow_player()
        buildHealthbar_boss()
      }
      /******************/

      /******************/
      function tweenTint(obj, startColor, endColor, time, callback) {    // create an object to tween with our step value at 0
        let game = phaserMaster.game();
        let colorBlend = {step: 0};    // create the tween on this object and tween its step property to 100
        let colorTween = game.add.tween(colorBlend).to({step: 100}, time);
         // run the interpolateColor function every time the tween updates, feeding it the
         // updated value of our tween each time, and set the result as our tint
         colorTween.onUpdateCallback(() => {
           obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
         });

         // if you passed a callback, add it to the tween on complete
         if (callback) {
             colorTween.onComplete.add(callback, game);
         }
         // set the object to the start color straight away
         obj.tint = startColor;
          // start the tween
         colorTween.start();
      }
      /******************/

      /******************/
      function changeVelocityFactor(speed:number, duration:number){
        let {velocityFactor} = phaserMaster.getOnly(['velocityFactor'])
        let waveSize = 100;
        let to = (speed >= velocityFactor.y) ? velocityFactor.y : speed
        let from = (speed >= velocityFactor.y) ? speed : velocityFactor.y
        let reverse = (speed >= velocityFactor.y) ? false : true
        let cosWave = game.math.sinCosGenerator(waveSize, from, null, to).cos
        let count = 0;

        cosWave = cosWave.filter( (num, index) => {
          num = Math.abs(num)
          if(index < waveSize/2){
            return num >= to
          }
        })
        if(reverse){cosWave = cosWave.reverse()}

        let vInterval = setInterval(() => {
          let vy = Phaser.Math.roundTo(Math.abs(cosWave[count]), -2)
          phaserMaster.forceLet('velocityFactor', {x: velocityFactor.x, y:vy})
          count++;
          if(count >= cosWave.length){
            phaserMaster.forceLet('velocityFactor', {x: velocityFactor.x, y:speed})
            window.clearInterval(vInterval)
          }
        }, duration/cosWave.length)

      }
      /******************/

      /******************/
      function buildTransitionScreen(){
        let game = phaserMaster.game();
            game.physics.startSystem(Phaser.Physics.ARCADE);
        // animate in
        utilityManager.buildOverlayBackground('#ffffff', '#ffffff', 19, true)
        utilityManager.buildOverlayGrid(240, 132, 20, 'logo_small')

        // create boundry
        let boundryObj = phaserBitmapdata.addGradient({name: 'boundryObj', start: '#ffffff', end: '#ffffff', width: 5, height: 5, render: false})
        let leftBoundry = phaserSprites.add({x: -9, y: -game.world.height/2, name: `leftBoundry`, group: 'boundries', width:10, height: game.world.height*2, reference: boundryObj.cacheBitmapData, alpha: 0})
        let rightBoundry = phaserSprites.add({x: game.world.width - 1, y: -game.world.height/2, name: `rightBoundry`, group: 'boundries', width:10, height: game.world.height*2, reference: boundryObj.cacheBitmapData, alpha: 0})
        game.physics.enable([leftBoundry,rightBoundry], Phaser.Physics.ARCADE);
        leftBoundry.body.immovable = true;
        rightBoundry.body.immovable = true;
      }
      /******************/

      /******************/
      function buildIntroLettering(callback:any){
        let skipAnimation = false

        if(skipAnimation){
          callback()
        }
        else{
          let lettering = buildLetteringSprites('mission 1', 10, 1.1);
          lettering.y = lettering.y - 100
          lettering.children.map(obj => {
            obj.reveal()
          })

          let divider
          game.time.events.add(1000, () => {
            divider = phaserSprites.addFromAtlas({x: game.world.centerX, y: lettering.y + lettering._height + 30, name: `divider`, filename: 'divider', atlas: 'atlas_main', alpha: 0})
            divider.anchor.setTo(0.5, 0.5)
            game.add.tween(divider).to( { alpha: 1, y: divider.y-5 }, Phaser.Timer.SECOND, Phaser.Easing.Linear.In, true, 1, 0, false).autoDestroy = true;
          }).autoDestroy = true

          let sublettering
          game.time.events.add(2000, () => {
            sublettering = buildLetteringSprites('into the breach', 10, 0.35);
            sublettering.y = sublettering.y - 20
            game.time.events.add(1, () => {
              sublettering.children.map(obj => {
                obj.reveal()
              })
            })
          }).autoDestroy = true

          game.time.events.add(4500, () => {
            changeVelocityFactor(1.5, 2500);
            lettering.children.map(obj => {
              obj.hide()
            })
          })

          game.time.events.add(5000, () => {
            game.add.tween(divider).to( { alpha: 0 }, Phaser.Timer.SECOND, Phaser.Easing.Linear.In, true, 1, 0, false).autoDestroy = true;
          })

          game.time.events.add(5500, () => {
            sublettering.children.map(obj => {
              obj.hide()
            })
          })

          game.time.events.add(7000, () => {
            callback();
          })
        }
      }
      /******************/

      /******************/
      function buildBackground(){
        let {w, h} = phaserMaster.getResolution()
        let {starMomentum} = phaserMaster.getOnly(['starMomentum'])

        let background1 = phaserSprites.addTilespriteFromAtlas({ name: 'bg1', group: 'backgrounds', x: 0, y: 0, width: game.world.width, height: game.world.height, atlas: 'atlas_large', filename: 'planetBG' });
            //background1.count = 0;
            background1.tileScale.x = 0.5
            background1.tileScale.y = 0.5
            background1.onUpdate = () =>  {
                let {velocityFactor} = phaserMaster.getOnly(['velocityFactor'])
                background1.tilePosition.y += 0.5*((velocityFactor.y-1)*5) <= 0 ? 0.5 : 0.5*((velocityFactor.y-1)*5)
                background1.tilePosition.x += (starMomentum.x/4)*velocityFactor.y
            };
        phaserGroup.addMany(phaserMaster.get('layers').BACKGROUND_0, [background1])

        let background2 = phaserSprites.addTilespriteFromAtlas({ name: 'bg2', group: 'backgrounds', x: 0, y: 0, width: game.world.width, height: game.world.height, atlas: 'atlas_large', filename: 'Nebula1' });
            background2.tilePosition.x = 500
            background1.tileScale.x = 0.75
            background1.tileScale.y = 0.75
            background2.onUpdate = () => {
                let {velocityFactor} = phaserMaster.getOnly(['velocityFactor'])
                background2.tilePosition.y += 2*((velocityFactor.y-1)*5) <= 0 ? 1 : 2*((velocityFactor.y-1)*5)
                background2.tilePosition.x += (starMomentum.x/2)*velocityFactor.x

            };
        phaserGroup.addMany(phaserMaster.get('layers').BACKGROUND_1, [background2])

        let foreground1 = phaserSprites.addTilespriteFromAtlas({ name: 'fg1', group: 'backgrounds', x: 0, y: 0, width: game.world.width, height: game.world.height, atlas: 'atlas_large', filename: 'Nebula2', alpha: 0.25});
            foreground1.tilePosition.x = 300
            foreground1.onUpdate = () => {
                let {velocityFactor} = phaserMaster.getOnly(['velocityFactor'])
                foreground1.tilePosition.y += 5*((velocityFactor.y-1)*5) <= 0 ? 1.5 : 5*((velocityFactor.y-1)*5)
                foreground1.tilePosition.x += starMomentum.x*velocityFactor.x
            };
        phaserGroup.addMany(phaserMaster.get('layers').FOREGROUND_0, [foreground1])


        // // stars
        //let stars = phaserBmd.addGradient({name: 'starBmp', group: 'blockBmpGroup', start: '#ffffff', end: '#ffffff', width: 1, height: 1, render: false})
        for (let i = 0; i < 10; i++){
            let star = phaserSprites.addFromAtlas({x: game.rnd.integerInRange(0, game.world.width), y:game.rnd.integerInRange(0, game.world.height), name: `star_${i}`, group: 'starfield', filename: `stars_layer_${game.rnd.integerInRange(1, 3)}`, atlas: 'atlas_main', visible: true})
                star.starType = game.rnd.integerInRange(1, 3);
                star.scale.setTo(star.starType/2, star.starType/2);
                star.onUpdate = function(){
                  let baseMomentum = 0.25 + (3 - star.starType)*5
                  let {velocityFactor, starMomentum} = phaserMaster.getOnly(['velocityFactor', 'starMomentum'])
                  if(this.y  > this.game.world.height){
                    this.y = 10
                    this.x = game.rnd.integerInRange(-100, game.world.width)
                  }
                  if(this.x  > this.game.world.width){
                    this.x = 0
                  }
                  if(this.x  < 0){
                    this.x = this.game.world.width
                  }

                  if(starMomentum.x > 0){
                    starMomentum.x -= 0.05
                  }
                  if(starMomentum.x < 0){
                    starMomentum.x += 0.05
                  }
                  if(starMomentum.y > 0){
                    starMomentum.y -= 0.05
                  }
                  if(starMomentum.y < 0){
                    starMomentum.y += 0.05
                  }
                  this.x += ((3 - star.starType)*starMomentum.x)*velocityFactor.x
                  this.y += (baseMomentum + ((3 - star.starType)*starMomentum.y))*velocityFactor.y
                }
                star.fadeOut = function(){
                  this.game.add.tween(this).to( { alpha: 0 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).autoDestroy = true;
                }
                switch(star.starType){
                  case 3:
                    phaserGroup.layer(phaserMaster.get('layers').BACKGROUND_0).add(star)
                  break
                  case 2:
                    phaserGroup.layer(phaserMaster.get('layers').BACKGROUND_1).add(star)
                  break
                  case 1:
                    phaserGroup.layer(phaserMaster.get('layers').FOREGROUND_0).add(star)
                  break
                }

        }

      }
      /******************/

      /******************/
      function buildMenuAndButtons(){
          let {w, h} = phaserMaster.getResolution()

          // BUILD MENU BUTTONS
          let menuButton1 = phaserSprites.addFromAtlas({ name: `menuButton1`, group: 'menuButtons', x: w/2, y:h/2 + 125, atlas: 'atlas_main', filename: 'ui_button', visible: false });
              menuButton1.anchor.setTo(0.5, 0.5)
              menuButton1.init = () => {
                menuButton1.visible = false
              }
              menuButton1.reveal = function(){
                this.visible = true;
              }
              menuButton1.text = phaserTexts.add({name: 'menuButton1Text', group: 'ui',  font: 'gem', size: 14, default: ``})
              menuButton1.text.anchor.setTo(0.5, 0.5)
              menuButton1.addChild(menuButton1.text)

          let menuButton2 = phaserSprites.addFromAtlas({ name: `menuButton2`, group: 'menuButtons',  x: w/2, y: h/2 + 175,  atlas: 'atlas_main', filename: 'ui_button', visible: true });
              menuButton2.anchor.setTo(0.5, 0.5)
              menuButton2.init = () => {
                menuButton2.visible = false
              }
              menuButton2.reveal = function(){
                this.visible = true;
              }
              menuButton2.text = phaserTexts.add({name: 'menuButton2Text', group: 'ui',  font: 'gem', size: 14, default: ``})
              menuButton2.text.anchor.setTo(0.5, 0.5)
              menuButton2.addChild(menuButton2.text)

          let menuButtonCursor = phaserSprites.addFromAtlas({ name: `menuButtonCursor`, group: 'menuButtons', x: w/2 - 125, atlas: 'atlas_main', filename: 'ui_cursor', visible: true });
              menuButtonCursor.anchor.setTo(0.5, 0.5)
              menuButtonCursor.init = () => {
                menuButtonCursor.visible = false
              }
              menuButtonCursor.reveal = function(){
                this.visible = true;
              }
              menuButtonCursor.updateLocation = function(val:number){
                phaserMaster.forceLet('menuButtonSelection', val)
                let button = phaserSprites.get(`menuButton${val}`)
                this.y = button.y;
              }
              menuButtonCursor.updateLocation(1);

          // add to layers
          phaserGroup.addMany(phaserMaster.get('layers').UI, [menuButton1, menuButton2, menuButtonCursor])
      }
      /******************/

      /******************/
      function buildBossWarning(){
        let warningBand = phaserSprites.addTilespriteFromAtlas({ name: 'showWarningBand', group: 'boss_ui', x: 0, y: game.world.centerY - 100, width: game.world.width, height: 100, atlas: 'atlas_main', filename: 'warning_band', alpha: 0 });
            warningBand.cosWave = {data: game.math.sinCosGenerator(150, 100 , 0, 1).cos, count: 0}
            warningBand.onUpdate = () => {
                let {showWarningBand} = phaserMaster.getOnly(['showWarningBand'])
                if(showWarningBand){
                  warningBand.cosWave.count++
                  if(warningBand.cosWave.count > warningBand.cosWave.data.length - 1){ warningBand.cosWave.count = 0}
                  warningBand.alpha = Math.round(warningBand.cosWave.data[warningBand.cosWave.count])
                  warningBand.tilePosition.x += 10
                }
                else{
                  if(warningBand.cosWave.count !== 0){
                    warningBand.cosWave.count++
                    if(warningBand.cosWave.count > warningBand.cosWave.data.length - 1){ warningBand.cosWave.count = 0}
                    warningBand.alpha = Math.round(warningBand.cosWave.data[warningBand.cosWave.count])
                    warningBand.tilePosition.x += 10
                  }
                }
            };

      }
      /******************/

      /******************/
      function buildMothership(){
        let mothership = phaserSprites.addFromAtlas({name: `mothership`, group:'mothership', atlas: 'atlas_ships', filename: `motherbase`, y:game.world.height + 200, visible: false})
            mothership.anchor.setTo(0.5, 0.5)
            mothership.scale.setTo(1.25, 1.25)

        mothership.docksequence = (player, callback:any) => {
          let {x, y} = player;
          shakeWorld(0.002, 30000)
          mothership.visible = true;
          mothership.x = x
          game.add.tween(mothership).to( { y: y }, Phaser.Timer.SECOND*8, Phaser.Easing.Back.InOut, true, 1, 0, false).
            onComplete.add(() => {
              shakeWorld(0.003, 30000)
              player.visible = false
              game.add.tween(mothership).to( { y: -(mothership.height) }, Phaser.Timer.SECOND*1.5, Phaser.Easing.Quartic.In, true, 100, 0, false).
                onComplete.add(() => {
                  callback()
                })
            })
        }
      }
      /******************/

      /******************/
      function buildScoreAndScrap(){
        let game = phaserMaster.game();
        let {w, h} = phaserMaster.getResolution()

        let scoreContainer = phaserSprites.addFromAtlas({name: `scoreContainer`, group: 'uiScore', org: 'ui', filename: 'ui_roundContainer', atlas: 'atlas_main', visible: false})
        scoreContainer.anchor.setTo(0.5, 0.5)
        phaserSprites.centerOnPoint('scoreContainer', w/2 + scoreContainer.width/2, scoreContainer.height/2 + scoreContainer.height/2 + 15)
        phaserGroup.addMany(phaserMaster.get('layers').UI, [scoreContainer])
        scoreContainer.setDefaultPositions()

        //states
        scoreContainer.init = () => {
          scoreContainer.y  = -100
        }
        scoreContainer.reveal = () => {
          let y = scoreContainer.getDefaultPositions().y
          scoreContainer.setDefaultPositions();
          game.add.tween(scoreContainer).to( { y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {})
        }
        scoreContainer.hide = () => {
          game.add.tween(scoreContainer).to( { y: scoreContainer.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {})
        }

        // text
        let scoreText = phaserTexts.add({name: `scoreText`, group: 'uiScore', font: 'gem', size: 18, default: '1100', visible: true})
        scoreText.anchor.setTo(0.5, 0.5)
        scoreContainer.addChild(scoreText)

        // text states
        scoreText.init = () => {
          scoreText.updateScore()
        }
        scoreText.updateScore = () => {
          scoreText.setText(`${phaserMaster.get('gameData').score}`)
        }

        // scrapCtonainer
        let scrapContainer = phaserSprites.addFromAtlas({name: `scrapContainer`, group: 'uiScrap', org: 'ui', filename: 'scrapContainer', atlas: 'atlas_main', visible: true})
        scrapContainer.anchor.setTo(0.5, 0.5)
        scrapContainer.showLifespan = game.time.returnTrueTime() + (Phaser.Timer.SECOND*2)
        scrapContainer.isShowing
        phaserSprites.centerOnPoint('scrapContainer', 65, scrapContainer.height/2 + scrapContainer.height/2 + 15)
        phaserGroup.addMany(phaserMaster.get('layers').UI, [scrapContainer])

        //states
        scrapContainer.init = () => {
          scrapContainer.y  = -50
          scrapContainer.isShowing = false;
        }
        scrapContainer.onPickup = () => {
          if(!scrapContainer.isShowing){
            scrapContainer.reveal()
          }
          else{
            scrapText.updateScrap()
          }
          scrapContainer.showLifespan = game.time.returnTrueTime() + (Phaser.Timer.SECOND*3)
        }
        scrapContainer.onUpdate = () => {
          if(game.time.returnTrueTime() > scrapContainer.showLifespan && scrapContainer.isShowing){
            scrapContainer.hide()
          }
        }
        scrapContainer.reveal = () => {
          scrapContainer.isShowing = true
          game.add.tween(scrapContainer).to( { y: 25 }, 1000, Phaser.Easing.Back.InOut, true, 1, 0, false).
            onComplete.add(() => {
              scrapText.updateScrap()
            })
        }
        scrapContainer.hide = () => {
          scrapContainer.isShowing = false
          game.add.tween(scrapContainer).to( { y: -50 }, 1000, Phaser.Easing.Back.InOut, true, 1, 0, false).
            onComplete.add(() => {

            })
        }

        // text
        let scrapText = phaserTexts.add({x: -8, y:5,  name: `scrapText`, group: 'uiScrap', font: 'gem', size: 16, default: '0', visible: true})
        scrapText.stroke = '#000000';
        scrapText.strokeThickness = 2;
        scrapText.fill = '#43d637';
        scrapText.updateText();

        scrapText.anchor.setTo(0.5, 0.5)
        scrapContainer.addChild(scrapText)

        // text states
        scrapText.init = () => {
          scrapText.updateScrap()
        }
        scrapText.updateScrap = () => {
          scrapText.scale.setTo(1.25, 1.25)
          scrapText.setText(`${phaserMaster.get('gameData').scrap}`)
          game.add.tween(scrapText.scale).to( { x:1, y:1 }, 250, Phaser.Easing.Back.InOut, true, 1, 0, false).
            onComplete.add(() => {})
        }

      }
      /******************/

      /******************/
      function buildHealthbar_player(){
        let game = phaserMaster.game();
        let {w, h} = phaserMaster.getResolution()

        let healthbar_player = phaserSprites.addFromAtlas({y: 100, name: `healthbar_player`, group: 'player_healthbar', org:'ui', filename: 'healthbar_player', atlas: 'atlas_main', visible: true})
        phaserSprites.centerOnPoint('healthbar_player', 200, h - healthbar_player.height/2 - 8)
        phaserGroup.addMany(phaserMaster.get('layers').UI, [healthbar_player])
        healthbar_player.setDefaultPositions()

        // children
        // damagebar
        let unit_damage_player = phaserSprites.addFromAtlas({x: 5, y: 3,  width: healthbar_player.width - 10, name: `unit_damage_player`, filename: 'unit_damage', atlas: 'atlas_main', visible: true})
            unit_damage_player.maxHealth = unit_damage_player.width - 10;
        healthbar_player.addChild(unit_damage_player)
        unit_damage_player.init = () => {}
        unit_damage_player.updateHealth = (remaining:number) => {
          let healthRemaining = remaining/100
          let {damageBar} = phaserMaster.getAll();
          if(damageBar !== undefined){
            damageBar.stop()
          }
          phaserMaster.forceLet('damageBar',game.add.tween(unit_damage_player).to( { width: unit_damage_player.maxHealth * healthRemaining }, 500, Phaser.Easing.Linear.In, true, 500, 0, false))
        }

        // healthbar
        let unit_health_player = phaserSprites.addFromAtlas({x: 5, y: 3, width: healthbar_player.width - 10, name: `unit_health_player`, filename: 'unit_health', atlas: 'atlas_main', visible: true})
            healthbar_player.maxHealth = healthbar_player.width - 10;
        healthbar_player.addChild(unit_health_player)
        unit_health_player.init = () => {
          let {gameData} = phaserMaster.getOnly(['gameData']);
          let health = gameData.player.health
          updateShipHealthbar(health)
        }
        unit_health_player.updateHealth = (remaining:number) => {
          let healthRemaining = remaining/100
          unit_health_player.width = healthbar_player.maxHealth * healthRemaining;
        }

        // states
        healthbar_player.init = () => {
          healthbar_player.y  = healthbar_player.y + 200
          healthbar_player.isHidden = true
        }
        healthbar_player.reveal = () => {
          if(healthbar_player.isHidden){
            healthbar_player.isHidden = false;
            let y = healthbar_player.getDefaultPositions().y
            healthbar_player.setDefaultPositions();
            game.add.tween(healthbar_player).to( { y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
              onComplete.add(() => {
                healthbar_player.buildLives()
              })
          }
        }
        healthbar_player.hide = () => {
          if(!healthbar_player.isHidden){
            healthbar_player.isHidden = true
            game.add.tween(healthbar_player).to( { y: healthbar_player.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
              onComplete.add(() => {})
          }
        }
        healthbar_player.fadeIn = () => {
            game.add.tween(healthbar_player).to( { alpha: 1 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.In, true, 1, 0, false).
              onComplete.add(() => {})
        }
        healthbar_player.fadeOut = () => {
            game.add.tween(healthbar_player).to( { alpha: 0 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.Out, true, 1, 0, false).
              onComplete.add(() => {})
        }

        // life icons
        healthbar_player.buildLives = () => {
          let {gameData} = phaserMaster.getOnly(['gameData']);
          for(let i = 0; i < gameData.player.lives; i++){
              let lifeIcon = phaserSprites.addFromAtlas({x: 0 + (25 * i), y: -25, name: `life_icon_${game.rnd.integer()}`, group: 'playerLives', filename: 'ship_icon', atlas: 'atlas_main', alpha: 0})
              healthbar_player.addChild(lifeIcon)
              game.add.tween(lifeIcon).to( { alpha: 1 }, 250, Phaser.Easing.Linear.In, true, (i*250), 0, false)
              lifeIcon.destroyIt = () => {
                game.add.tween(lifeIcon).to( { y: lifeIcon.y - 10, alpha: 0 }, 250, Phaser.Easing.Linear.In, true, 1, 0, false).
                  onComplete.add(() => {
                    phaserSprites.destroy(lifeIcon.name)
                  })
              }
          }
        }
        healthbar_player.loseLife = () => {
          let lives = phaserSprites.getGroup('playerLives');
          let life = lives[lives.length - 1]
              life.destroyIt();
        }

        // let unit_health_player = phaserSprites.addFromAtlas({x: 5, y: 3, width: 150, name: `unit_health_player`, filename: 'unit_health', atlas: 'atlas_main', visible: true})
        // healthbar_player.addChild(unit_health_player)
      }
      /******************/

      /******************/
      function buildPow_player(){
        let game = phaserMaster.game();
        let {w, h} = phaserMaster.getResolution()

        let powerbar = phaserSprites.addFromAtlas({name: `powerbar`, group: 'player_pow', org:'ui', filename: 'powerbar', atlas: 'atlas_main', visible: true})
        phaserSprites.centerOnPoint('powerbar', w - powerbar.width/2 - 10, h - powerbar.height/2 - 8)
        phaserGroup.addMany(phaserMaster.get('layers').UI, [powerbar])
        powerbar.setDefaultPositions()

        // children
        powerbar.setup = () => {
          //setup bars
          let useBar = 1
          for(let i = 0; i < 30; i++){
            let bar = phaserSprites.addFromAtlas({x:i * 8 + 5, y: 9, name: `powerbar_pow_${i}`, filename: `powerbar_level_${Math.floor(i/5) + 1}`, group: 'powerbar_bars', atlas: 'atlas_main', visible: true})
            bar.anchor.setTo(0.5, 0.5)
            bar.popOut = (delay:number) => {
              game.time.events.add(delay, () => {
                bar.scale.setTo(1.5, 1.5)
                game.add.tween(bar.scale).to( { x:1, y:1 }, 350, Phaser.Easing.Back.InOut, true, 1, 0, false)
              }).autoDestroy = true
            }

            bar.popLost = () => {
              game.add.tween(bar).to( { y: bar.y - 5, alpha: 0.5 }, 350, Phaser.Easing.Linear.In, true, 1, 0, false).
                onComplete.add(() => {
                  bar.y = bar.getDefaultPositions().y
                  bar.alpha = 1
                  bar.visible = false
                })
            }

            powerbar.addChild(bar)
          }
          // icon
          let powerbar_pow = phaserSprites.addFromAtlas({x: -20, y: 0, name: `powerbar_pow`, filename: 'powerbar_pow', atlas: 'atlas_main', visible: true})
          powerbar.addChild(powerbar_pow)
        }

        powerbar.updatePowerbar = () => {
          let {gameData} = phaserMaster.getOnly(['gameData']);
          let val = gameData.player.powerup
          let bars = phaserSprites.getGroup('powerbar_bars');
          for(let i = 0; i < bars.length; i++ ){

            bars[i].visible = true
            bars[i].popOut(i*35)
          }
          for(let i = val; i < bars.length; i++ ){
            bars[i].visible = false
            bars[i].popLost(i*35)
          }
        }

        powerbar.animateFull = () => {
          let bars = phaserSprites.getGroup('powerbar_bars');
          for(let i = 0; i < 30; i++ ){
            bars[i].visible = true
            bars[i].popOut(i*25)
          }
        }

        // states
        powerbar.init = () => {
          powerbar.y  = powerbar.y + 200
          powerbar.setup()
          powerbar.updatePowerbar()
          powerbar.isHidden = true
        }
        powerbar.reveal = () => {
          if(powerbar.isHidden){
            powerbar.isHidden = false
            let y = powerbar.getDefaultPositions().y
            powerbar.setDefaultPositions();
            game.add.tween(powerbar).to( { y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
              onComplete.add(() => {})
          }
        }
        powerbar.hide = () => {
          if(!powerbar.isHidden){
            powerbar.isHidden = true
            game.add.tween(powerbar).to( { y: powerbar.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
              onComplete.add(() => {})
          }
        }
        powerbar.fadeIn = () => {
            game.add.tween(powerbar).to( { alpha: 1 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.In, true, 1, 0, false).
              onComplete.add(() => {})
        }
        powerbar.fadeOut = () => {
            game.add.tween(powerbar).to( { alpha: 0 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.Out, true, 1, 0, false).
              onComplete.add(() => {})
        }

        // SPECIAL ATTACKS
        let staticAnimation = [...Phaser.Animation.generateFrameNames('special_', 1, 5), 'special_1']
        for(let i = 0; i < 8; i++){
          let icon = phaserSprites.addFromAtlas({x:powerbar.width - 15 - (i * 30), y: -20, name: `special_icon_${i}`, group: 'special_icons', filename: `${staticAnimation[0]}`, atlas: 'atlas_main', visible: true})
          icon.anchor.setTo(0.5, 0.5)
          icon.animateInterval = game.time.returnTrueTime()
          icon.index = i;
          icon.animations.add('animate', staticAnimation, 1, true)


          icon.onUpdate = () => {
            // add to powerupbar every 2 seconds
            if(game.time.returnTrueTime() > icon.animateInterval){
              icon.animateInterval = game.time.returnTrueTime() + 5000
              game.time.events.add(icon.index * 500, () => {
                icon.animations.play('animate', 10, false)
              }).autoDestroy = true
            }
          }


          powerbar.addChild(icon)
        }
      }
      /******************/

      /******************/
      function buildHealthbar_boss(){
        let game = phaserMaster.game();
        let {w, h} = phaserMaster.getResolution()

        let healthbar_boss = phaserSprites.addFromAtlas({ name: `healthbar_boss`, group: 'boss_healthbar',  filename: 'healthbar_boss', atlas: 'atlas_main', visible: true})
        phaserSprites.centerOnPoint('healthbar_boss', w/2, 25)
        phaserGroup.addMany(phaserMaster.get('layers').UI, [healthbar_boss])
        healthbar_boss.setDefaultPositions()

        // children
        let unit_damage_boss = phaserSprites.addFromAtlas({x: 5, y: 3, width: healthbar_boss.width - 10, name: `unit_damage_boss`, filename: 'unit_damage', atlas: 'atlas_main', visible: true})
        unit_damage_boss.maxHealth = unit_damage_boss.width;
        unit_damage_boss.fillComplete = false;
        healthbar_boss.addChild(unit_damage_boss)
        unit_damage_boss.init = () => { unit_damage_boss.width = 0 }
        unit_damage_boss.updateHealth = (remaining:number) => {
          let healthRemaining = remaining/100
          let {enemyDamageBar} = phaserMaster.getAll();
          if(enemyDamageBar !== undefined){
            enemyDamageBar.stop()
          }
          phaserMaster.forceLet('enemyDamageBar',game.add.tween(unit_damage_boss).to( { width: unit_damage_boss.maxHealth * healthRemaining }, 500, Phaser.Easing.Linear.In, true, 500, 0, false))
        }
        unit_damage_boss.fill = (remaining:number) => {
          let healthRemaining = remaining/100
          game.add.tween(unit_damage_boss).to( { width: unit_damage_boss.maxHealth * healthRemaining}, Phaser.Timer.SECOND, Phaser.Easing.Exponential.Out, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {
              unit_damage_boss.fillComplete = true;
            })
        }


        let unit_health_boss = phaserSprites.addFromAtlas({x: 5, y: 3, width: healthbar_boss.width - 10,  name: `unit_health_boss`, filename: 'unit_health', atlas: 'atlas_main', visible: true})
        unit_health_boss.maxHealth = unit_health_boss.width;
        unit_health_boss.fillComplete = false;
        healthbar_boss.addChild(unit_health_boss)
        unit_health_boss.init = () => { unit_health_boss.width = 0 }
        unit_health_boss.updateHealth = (remaining:number) => {
          if(unit_health_boss.fillComplete){
            let healthRemaining = remaining/100
            unit_health_boss.width = unit_health_boss.maxHealth * healthRemaining;
          }
        }
        unit_health_boss.fill = (remaining:number, callback:any = () => {}) => {
          let healthRemaining = remaining/100
          game.add.tween(unit_health_boss).to( { width: unit_health_boss.maxHealth * healthRemaining}, Phaser.Timer.SECOND, Phaser.Easing.Exponential.Out, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {
              unit_health_boss.fillComplete = true;
              callback()
            })
        }

        let bossbar_portrait = phaserSprites.addFromAtlas({x: -18, y: -2, name: `bossbar_portrait`, filename: 'bossbar_picture', atlas: 'atlas_main', visible: true})
        healthbar_boss.addChild(bossbar_portrait)

        // states
        healthbar_boss.init = () => {
          healthbar_boss.y  = -200
        }
        healthbar_boss.reveal = () => {
          let y = healthbar_boss.getDefaultPositions().y
          healthbar_boss.setDefaultPositions();
          game.add.tween(healthbar_boss).to( { y: y  }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {
              fillEnemyhealth(phaserMaster.get('bossHealth'))
            })
        }
        healthbar_boss.hide = () => {
          game.add.tween(healthbar_boss).to( { y: healthbar_boss.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
            onComplete.add(() => {})
        }



      }
      /******************/

      /******************/
      function buildLetteringSprites(letters:any, padding:number = 10, scale:number = 1){
        let game = phaserMaster.game();
        let {w, h} = phaserMaster.getResolution()
        let container = game.add.sprite(0, 0);
            container._width = 0
            container._height = 0

        letters = letters.split('')

        letters.map( (letter, index) => {
            if(letter === ' '){
              container._width += (padding*3)
            }
            else{
              let l = phaserSprites.addFromAtlas({x: container._width, name: `l_${game.rnd.integer()}`, filename: `${letter}`, atlas: 'atlas_letters', visible: false})
              container._width += l.width + padding
              container._height = l.height
              l.setDefaultPositions();

              l.init = () => {
                l.x = -200
                l.scale.setTo(0.1, 0.1)
              }
              l.reveal = () => {
                l.visible = true;
                game.add.tween(l.scale).to( { x: 1, y: 1 }, Phaser.Timer.SECOND, Phaser.Easing.Elastic.Out, true, index*100, 0, false).
                game.add.tween(l).to( { x: l.getDefaultPositions().x }, Phaser.Timer.SECOND, Phaser.Easing.Elastic.Out, true, index*50, 0, false).
                  onComplete.add(() => {})
              }
              l.hide = () => {
                game.add.tween(l).to( { alpha: 0, y: l.y - 25 }, Phaser.Timer.SECOND, Phaser.Easing.Exponential.Out, true, index*50, 0, false).
                  onComplete.add(() => {
                    phaserSprites.destroy(l.name)
                  })
              }
              l.init();
              container.addChild(l)
            }
        })
        container.scale.setTo(scale, scale)
        container.x = w/2 - (container._width/2 - padding)*scale
        container.y = h/2 - (container.height/2)*scale

        phaserGroup.addMany(phaserMaster.get('layers').UI, [container])
        return container
      }
      /******************/

      /******************/
      function preloadComplete(){
        let game = phaserMaster.game();
        let isDevMode = phaserMaster.get('devMode')
        let {overlay} = phaserSprites.getOnly(['overlay']);
        let skipAnimation = false;

        // run init on all ui elements to put them in their initial place
        phaserSprites.getAll('ARRAY').map(obj => {
          obj.init()
        })

        phaserTexts.getAll('ARRAY').map(obj => {
          obj.init()
        })

        // get correct special weapon count
        updateSpecials()

        // create player
        let player = createPlayer();
            game.camera.follow(player);

        let music = game.add.audio('music-main');
            music.play();            

        // wipein
        overlayControls('WIPEOUT', () => {
          utilityManager.overlayBGControls({transition: 'FADEOUT', delay: 500, speed: skipAnimation ? 1 : 1000}, () => {
            playIntroSequence()
          })
        })
      }
      /******************/

      /******************/
      function playIntroSequence(){
        let {clock, dialogPortraits} = phaserMaster.getOnly(['clock', 'dialogPortraits']);
        let player = phaserSprites.get('player')
        let skipAnimation = false;


        if(skipAnimation){
          phaserSprites.getGroup('ui').map(obj => {
            obj.reveal()
          })
          player.moveToStart();
          clock.start()
          phaserMaster.changeState('READY');
        }
        else{
          // intro lettering
          buildIntroLettering(() => {
            game.time.events.add(Phaser.Timer.SECOND, () => {
              // create player
              player.moveToStart();

              let script = [
                {text: "I'm approaching the asteroid field now.", portrait: dialogPortraits.PLAYER, autoplay: true},
                {text: "You know the drill.  Just destroy as many as rocks as possible.  We'll be right behind you to collect the pieces.", portrait: dialogPortraits.MOTHERSHIP},
                {text: "Yep, and then we sell the rare minerals for money.  ", portrait: dialogPortraits.PLAYER},
                {text: "Okay, be careful out there.", portrait: dialogPortraits.MOTHERSHIP},
                {text: "Always.", portrait: dialogPortraits.PLAYER}
              ]

              dialogManager.start(script, () => {
                game.time.events.add(Phaser.Timer.SECOND, () => {
                  phaserSprites.getGroup('ui').map(obj => {
                    obj.reveal()
                  })
                  // start game
                  clock.start()
                  phaserMaster.changeState('READY');
                }).autoDestroy = true;
              })

            }).autoDestroy = true
          })
        }
      }
      /******************/

      /******************/
      function overlayControls(transition:string, callback:any = ()=>{}){
        let skipAnimation = false
        utilityManager.overlayControls(
          { transition: transition,
            delay: skipAnimation ? 0 : 1000,
            speed: skipAnimation ? 0 : 250,
            tileDelay: skipAnimation ? 0 : 5}, callback)
      }
      /******************/

      /******************/
      function updateShipHealthbar(remaining:number){
        let {unit_damage_player, unit_health_player} = phaserSprites.getOnly(['unit_damage_player', 'unit_health_player'])
        //checkStaticLevels(remaining)
        unit_damage_player.updateHealth(remaining)
        unit_health_player.updateHealth(remaining)
      }

      function addHealth(amount:number){
        let {gameData} = phaserMaster.getOnly(['gameData']);
        let health = gameData.player.health + amount
        if(health > 100){ health = 100  }
        saveData('player', {health: health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: gameData.player.special})
        fillShipHealthbar(health)
      }

      function fillShipHealthbar(remaining:number){
        let {unit_damage_player, unit_health_player} = phaserSprites.getOnly(['unit_damage_player', 'unit_health_player'])
        //checkStaticLevels(remaining)
        unit_damage_player.updateHealth(remaining)
        unit_health_player.updateHealth(remaining)
      }

      function checkStaticLevels(health:number){
        let {staticContainer} = phaserSprites.getOnly(['staticContainer'])
        if(health > 0 && health < 15){ staticContainer.setStaticLevel('HEAVY') }
        if(health > 15 && health < 35){ staticContainer.setStaticLevel('MED') }
        if(health > 35){ staticContainer.setStaticLevel('LIGHT') }
      }
      /******************/

      /******************/
      function updateEnemyHealth(remaining:number){
        let {unit_damage_boss, unit_health_boss} = phaserSprites.getOnly(['unit_damage_boss', 'unit_health_boss'])
        unit_damage_boss.updateHealth(remaining)
        unit_health_boss.updateHealth(remaining)
      }

      function fillEnemyhealth(remaining:number){
        let {unit_damage_boss, unit_health_boss} = phaserSprites.getOnly(['unit_damage_boss', 'unit_health_boss'])
        unit_health_boss.fill(remaining, () => {
            unit_damage_boss.updateHealth(remaining)
        })
      }
      /******************/

      /******************/
      function updateBossBar(remaining:number){
        let game = phaserMaster.game();
        let bars = (10 * (remaining*.01))
        let {bossBar} = phaserMaster.getAll();
        if(bossBar !== undefined){
          game.add.tween(bossBar).to( { x: -244 + (24.4*bars) }, 1, Phaser.Easing.Linear.Out, true, 0, 0, false)
        }
      }
      /******************/

      /******************/
      function playSequence(wordString:String, callback:any){
        let game = phaserMaster.game();

          let wordlist = wordString.split(" ");

          wordlist.map( (word, index) => {
            let splashText = phaserTexts.add({name: `splashText_${game.rnd.integer()}`, group: 'splash', font: 'gem', size: 18, default: word, visible: false})
                splashText.startSplash = function(){
                  this.visible = true;
                  this.scale.setTo(10, 10)
                  phaserTexts.alignToCenter(this.name)
                  game.add.tween(this.scale).to( { x:0.5, y:0.5}, 350, Phaser.Easing.Linear.In, true, 0);
                  game.add.tween(this).to( { x: this.game.world.centerX, y: this.game.world.centerY, alpha: 0.75}, 350, Phaser.Easing.Linear.In, true, 0)
                  game.time.events.add(350, () => {
                    phaserTexts.destroy(this.name)
                  }).autoDestroy = true;
                }
                game.time.events.add((Phaser.Timer.SECOND/2.5 * index) + 100, splashText.startSplash, splashText).autoDestroy = true;
          })

          game.time.events.add(Phaser.Timer.SECOND/2.5 * wordlist.length, callback, this).autoDestroy = true;

      }
      /******************/

      /******************/
      function addPowerup(){
        let {gameData} = phaserMaster.getOnly(['gameData']);
        let {powerbar} = phaserSprites.getOnly(['powerbar'])
        let val = gameData.player.powerup + 1
        if(val > 30){
          val = 30
          powerbar.animateFull()
        }
        else{
          saveData('player', {health: gameData.player.health, lives: gameData.player.lives, powerup: val, special: gameData.player.special})
          powerbar.updatePowerbar();
        }
      }
      /******************/

      /******************/
      function losePowerup(){
        let {gameData} = phaserMaster.getOnly(['gameData']);
        let {powerbar} = phaserSprites.getOnly(['powerbar'])
        let val = gameData.player.powerup - 1
        if(val < 0){ val = 0 }
        saveData('player', {health: gameData.player.health, lives: gameData.player.lives, powerup: val, special: gameData.player.special})
        phaserSprites.get(`powerbar_pow_${val}`).popLost()
      }
      /******************/

      /******************/
      function addSpecial(){
        let {gameData} = phaserMaster.getOnly(['gameData']);
        let val = gameData.player.special + 1
        if(val > 9){val = 9}
        saveData('player', {health: gameData.player.health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: val})
        updateSpecials()
      }
      /******************/

      /******************/
      function loseSpecial(){
        let {gameData} = phaserMaster.getOnly(['gameData']);
        let val = gameData.player.special - 1
        if(val < 0){val = 0}
        saveData('player', {health: gameData.player.health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: val})
        updateSpecials()
      }
      /******************/

      /******************/
      function updateSpecials(){
          let {gameData} = phaserMaster.getOnly(['gameData']);
          let val = gameData.player.special
          let icons = phaserSprites.getGroup('special_icons');
          for(let i = 0; i < icons.length; i++ ){
            icons[i].visible = true
          }
          for(let i = val; i < icons.length; i++ ){
            icons[i].visible = false
          }
      }
      /******************/

      /******************/
      function createPlayer(){
        let game = phaserMaster.game();
        let {gameData, primaryWeapon, secondaryWeapon, perk} = phaserMaster.getOnly(['gameData', 'primaryWeapon', 'secondaryWeapon', 'perk'])


        let onUpdate = (player:any) => {

        }

        let onDamage = (player:any) => {
          shakeHealth();
          losePowerup();
        }

        let updateHealth = (health:number) => {
          let {gameData} = phaserMaster.getOnly(['gameData'])
          updateShipHealthbar(health)
          saveData('player', {health: health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: gameData.player.special})
        }

        let loseLife = (player:any) => {
          let {gameData} = phaserMaster.getOnly(['gameData'])
               gameData.player.lives--
          let {healthbar_player} = phaserSprites.getOnly(['healthbar_player'])
              healthbar_player.loseLife()

          if(gameData.player.lives > 0){
            saveData('player', {health: 100, lives: gameData.player.lives, powerup: 0, special: gameData.player.special})
            phaserControls.clearAllControlIntervals()
            phaserControls.disableAllInput()
            game.time.events.add(Phaser.Timer.SECOND, () => {
              updateHealth(100)
              player.moveToStart();
            }).autoDestroy = true
          }
          else{
            gameOver();
          }
        }

        let player = playerManager.createShip({name: 'player', group: 'playership', org: 'gameobjects', layer: phaserMaster.get('layers').PLAYER, shipId: gameData.pilot, primaryWeapon: primaryWeapon.reference, secondaryWeapon: secondaryWeapon.reference, perk: perk.reference}, updateHealth, onDamage, loseLife, onUpdate);

        return player
      }
      /******************/

      /******************/
      function createBigEnemy(options:any){
        // let game = phaserMaster.game();
        // let onDestroy = (enemy:any) => {
        //     let {gameData} = phaserMaster.getOnly(['gameData'])
        //          gameData.score += 200
        //     saveData('score', gameData.score)
        //     let {scoreText} = phaserTexts.getOnly(['scoreText'])
        //          scoreText.updateScore();
        // }
        // let onDamage = () => {}
        // let onFail = () => { }
        // let onUpdate = () => {}
        // let enemy = enemyManager.createBigEnemy1(options, onDamage, onDestroy, onFail, onUpdate)
      }
      /******************/

      /******************/
      function addToScore(amount:number){
        let {gameData} = phaserMaster.getOnly(['gameData'])
        let {scoreText} = phaserTexts.getOnly(['scoreText'])
            gameData.score += amount
            scoreText.updateScore();
            saveData('score', gameData.score)
      }
      /******************/

      /******************/
      function createAsteroid(options:any){
        let game = phaserMaster.game();
        let onDestroy = (enemy:any) => {
            addToScore(50)
            createAsteroid2({x: enemy.x, y: enemy.y})
        }
        let onDamage = () => {}
        let onUpdate = () => {}
        let enemy = enemyManager.createAsteroid1(options, onDamage, onDestroy, onUpdate)
      }
      /******************/

      /******************/
      function createAsteroid2(options:any){
        let game = phaserMaster.game();
        let onDestroy = (enemy:any) => {
            addToScore(50)
            spawnScrap(enemy.x, enemy.y)
        }
        let onDamage = () => {}
        let onUpdate = () => {}
        let enemy = enemyManager.createAsteroid2(options, onDamage, onDestroy, onUpdate)
      }
      /******************/

      /******************/
      function createSmallEnemy1(options:any){
        let game = phaserMaster.game();
        let onDestroy = (enemy:any) => {
            addToScore(100)
            spawnScrap(enemy.x, enemy.y)
        }
        let onDamage = () => {}
        let onUpdate = () => {}
        let enemy = enemyManager.createSmallEnemy1(options, onDamage, onDestroy, onUpdate)
      }
      /******************/

      /******************/
      function createBoss(options:any){
        let game = phaserMaster.game();
        let {healthbar_boss, player} = phaserSprites.getOnly(['healthbar_boss', 'player'])
        let onDestroy = (enemy:any) => {
            healthbar_boss.hide()
            player.removeTarget();
            game.time.events.add(Phaser.Timer.SECOND * 2, () => {
              endLevel()
            })
        }
        let onDamage = (enemy:any) => {
          let health = Math.round((enemy.health/enemy.maxHealth)*100)
          updateEnemyHealth(health)
        }
        let onUpdate = () => {}
        let enemy = enemyManager.createBoss1(options, onDamage, onDestroy, onUpdate)
        player.assignTarget(enemy.targetingBox)
      }
      /******************/

      /******************/
      function createSmallEnemy2(options:any){
        let game = phaserMaster.game();
        let onDestroy = (enemy:any) => {
            addToScore(200)
            spawnScrap(enemy.x, enemy.y)
        }
        let onDamage = () => {}
        let onUpdate = () => {}
        let enemy = enemyManager.createSmallEnemy2(options, onDamage, onDestroy, onUpdate)
      }
      /******************/

      /******************/
      function shakeWorld(intensity:number, duration:number){
        game.camera.shake(intensity, duration);
      }
      /******************/

      /******************/
      function shakeHealth(){
        let healthbar = phaserSprites.get('healthbar_player')
        // define the camera offset for the quake
        // we need to move according to the camera's current position
        let properties = {
          x: healthbar.x + game.rnd.integerInRange(-2, 2),
          y: healthbar.y + game.rnd.integerInRange(-2, 2)
        };
        // we make it a relly fast movement
        let duration = 45;
        let repeat = 1;
        let ease = Phaser.Easing.Bounce.InOut;
        let autoStart = false;
        let delay = 1;
        let yoyo = true;
        let quake = game.add.tween(healthbar).to(properties, duration, ease, autoStart, delay, 4, yoyo);
        quake.start();
      }
      /******************/

      /******************/
      function shakeUI(){
        let layer = phaserGroup.layer(10)
        // define the camera offset for the quake
        // we need to move according to the camera's current position
        let properties = {
          x: layer.x + game.rnd.integerInRange(-5, 5),
          y: layer.y + game.rnd.integerInRange(-5, 5)
        };
        // we make it a relly fast movement
        let duration = 50;
        let repeat = 2;
        let ease = Phaser.Easing.Bounce.InOut;
        let autoStart = false;
        let delay = 1;
        let yoyo = true;
        let quake = game.add.tween(layer).to(properties, duration, ease, autoStart, delay, 4, yoyo);
        quake.start();
      }
      /******************/

      /******************/
      function pauseGame(){
        phaserMaster.get('clock').stop();
        phaserMaster.forceLet('pauseStatus', true)
      }
      /******************/

      /******************/
      function unpauseGame(){
        phaserMaster.get('clock').start();
        phaserMaster.forceLet('pauseStatus', false)
      }
      /******************/

      /******************/
      function spawnHealthpack(x:number, y:number){
        let onPickup = () => {
          addHealth(25)
        }
        itemManager.spawnHealthpack(x, y, 6, onPickup)
      }
      /******************/

      /******************/
      function spawnPowerup(x:number, y:number){
        let onPickup = () => {
          addPowerup()
        }
        itemManager.spawnPowerup(x, y, 6, onPickup)
      }
      /******************/

      /******************/
      function spawnSpecial(x:number, y:number){
        let onPickup = () => {
          addSpecial()
        }
        itemManager.spawnSpecial(x, y, 6, onPickup)
      }
      /******************/

      /******************/
      function spawnScrap(x:number, y:number){
        let onPickup = () => {
          let {scrapContainer} = phaserSprites.getOnly(['scrapContainer'])
          let {gameData} = phaserMaster.getOnly(['gameData']);
          let scrap = gameData.scrap + 10
          saveData('scrap', scrap)

          scrapContainer.onPickup()
          //addPowerup()
        }
        itemManager.spawnScrap(x, y, 6, onPickup)
      }
      /******************/

      /******************/
      function incrementTime(duration:number){
        let {inGameSeconds} = phaserMaster.getOnly(['inGameSeconds'])
             inGameSeconds += duration
        phaserMaster.forceLet('inGameSeconds', inGameSeconds)
        return inGameSeconds
      }
      /******************/

      /******************/
      function director(){
        let {gameData, bossMode, powerupTimer} = phaserMaster.getOnly(['gameData', 'bossMode', 'powerupTimer'])
        let inGameSeconds = incrementTime(0.5)

        // add to powerupbar every 2 seconds
        if(game.time.returnTrueTime() > powerupTimer){
          phaserMaster.forceLet('powerupTimer', gameData.player.powerup < 30 ? game.time.returnTrueTime() + (Phaser.Timer.SECOND*3) : game.time.returnTrueTime() + (Phaser.Timer.SECOND/2) )
          addPowerup();
        }


        if(inGameSeconds === 30){
          startBossBattle(() => {
            createBoss({
              x: game.world.width/2,
              y: -300,
            });
          })
        }

        if(!bossMode){
          // if(inGameSeconds % 5 === 0){
          //   spawnSpecial(game.rnd.integerInRange(0 + 100, game.world.width - 100), 0)
          // }

          //create a steady steam of aliens to shoot
          if(inGameSeconds % 4 === 0){
              createAsteroid({
                x: game.rnd.integerInRange(0 + 100, game.world.width - 100),
                y: -game.rnd.integerInRange(100, 400),
                iy: game.rnd.integerInRange(0, 80),
              });
          }

          if(inGameSeconds > 2 && inGameSeconds % 4 === 0){
              createSmallEnemy1({
                x: game.rnd.integerInRange(0 + 100, game.world.width - 100),
                y: -game.rnd.integerInRange(100, 400)
              });
          }

          if(inGameSeconds % 2 === 0){
              createSmallEnemy1({
                x: game.rnd.integerInRange(0 + 100, game.world.width - 100),
                y: game.rnd.integerInRange(100, 400),
                iy: game.rnd.integerInRange(0, 80),
              });
          }
        }


      }
      /******************/

      /******************/
      function startBossBattle(callback:any){
         let game = phaserMaster.game();
         let {dialogPortraits} = phaserMaster.getOnly(['dialogPortraits']);
         let {scoreContainer, player, healthbar_boss} = phaserSprites.getOnly(['scoreContainer', 'player', 'healthbar_boss']);
         phaserMaster.forceLet('bossMode', true)
         phaserMaster.forceLet('showWarningBand', true)
         shakeWorld(0.005, 5000)

         // get boss info - assign
         let boss = {
          name: 'BOSS',
          health: 100
        }
         phaserMaster.forceLet('bossHealth', boss.health)
         changeVelocityFactor(3, 5000);
         player.moveTo(game.world.centerX, game.world.centerY + game.world.centerY/2, 6000, () => {
           phaserMaster.forceLet('showWarningBand', false)
           game.time.events.add(Phaser.Timer.SECOND * 1, () => {

             let script = [
               {text: 'Something big is approaching.  Looks very... murder-y.', portrait: dialogPortraits.PLAYER},
               {text: 'Well murder it first then.', portrait: dialogPortraits.MOTHERSHIP},
               {text: 'You are a terrible life coach.', portrait: dialogPortraits.PLAYER},
             ]
             dialogManager.start(script, () => {
               scoreContainer.hide();
               healthbar_boss.reveal()
               callback()
             })


           }, this).autoDestroy = true;
         })
      }
      /******************/

      /******************/
      function update() {
        let game = phaserMaster.game();
        let {currentState} = phaserMaster.getState();
        let {starMomentum, primaryWeapon, secondaryWeapon, menuButtonSelection, elapsedTime, powerupTimer, gameData} = phaserMaster.getOnly(['starMomentum', 'primaryWeapon', 'secondaryWeapon', 'menuButtonSelection', 'elapsedTime', 'powerupTimer', 'gameData'])
        let {player, menuButtonCursor} = phaserSprites.getOnly(['player', 'menuButtonCursor']);
        let {DOWN, UP, LEFT, RIGHT, A, START} = phaserControls.getOnly(['DOWN', 'UP', 'LEFT', 'RIGHT', 'A', 'START'])

        //console.log(game.time.suggestedFps)
        if(currentState !== 'PAUSE' && currentState !== 'VICTORYSTATE' && currentState !== 'GAMEOVERSTATE' && currentState !== 'ENDLEVEL'){
          phaserSprites.getManyGroups(['ui', 'backgrounds', 'starfield', 'playership', 'special_icons', 'itemspawns', 'boss_ui']).map(obj => {
            obj.onUpdate()
          })
        }

        // DIALOG STATE
        if(currentState === 'DIALOG'){
          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: 500 })){
            dialogManager.next()
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'START', delay: 500 })){
            dialogManager.skipAll()
          }
        }

        // READY STATE
        if(currentState === 'READY'){

          if(phaserControls.checkWithDelay({isActive: true, key: 'START', delay: 500 })){
            // setInterval(() => {
            //   game.paused = true
            //   setTimeout(() => {
            //     game.paused = false
            //   }, 10)
            // }, 10)
          }

          // update director EVERY 1/2 second
          if(game.time.returnTrueTime() > elapsedTime){
            phaserMaster.forceLet('elapsedTime', game.time.returnTrueTime() + (Phaser.Timer.SECOND/2) )
            director()
          }


          phaserSprites.getManyGroups(['ui_overlay', 'enemies', 'boss', 'trashes']).map(obj => {
            if(obj !== undefined){
              obj.onUpdate()
            }
          })

          phaserTexts.getManyGroups(['ui_text', 'timeKeeper']).map(obj => {
            if(obj !== undefined){
              obj.onUpdate();
            }
          })

          // player controls
          if(RIGHT.active){
            starMomentum.x = -2
            player.moveX(5)
          }

          if(LEFT.active){
            starMomentum.x = 2
            player.moveX(-5)
          }

          if(UP.active){
            starMomentum.y = 5
            player.moveY(-5)
          }
          if(DOWN.active){
            starMomentum.y = -2
            player.moveY(5)
          }

          if(!UP.active && !DOWN.active){
            starMomentum.y = 0
          }

          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: primaryWeapon.cooldown - (A.state * primaryWeapon.rapidFireSpd) })){
            player.fireWeapon()
          }

          if(phaserControls.checkWithDelay( {isActive: true, key: 'B', delay:  500} ) && gameData.player.special > 0){
            loseSpecial()
            player.fireSubweapon()
          }
        }



        if(currentState === 'VICTORYSTATE'){
          if(phaserControls.checkWithDelay({isActive: true, key: 'UP', delay: 100 })){
            menuButtonCursor.updateLocation(1)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'DOWN', delay: 100 })){
            menuButtonCursor.updateLocation(2)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'START', delay: 250 })){
            phaserMaster.changeState('LOCKED');
            phaserControls.disableAllInput()
            switch(menuButtonSelection){
              case 1:
                updateStore();
                nextLevel();
                break
              case 2:
                updateStore();
                saveAndQuit();
                break
            }
          }
        }

        if(currentState === 'GAMEOVERSTATE'){
          if(phaserControls.checkWithDelay({isActive: true, key: 'UP', delay: 100 })){
            menuButtonCursor.updateLocation(1)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'DOWN', delay: 100 })){
            menuButtonCursor.updateLocation(2)
          }
          if(phaserControls.checkWithDelay({isActive: true, key: 'START', delay: 100 })){
            phaserControls.disableAllInput()
            switch(menuButtonSelection){
              case 1:
                retryLevel();
                break
              case 2:
                resetGame();
                break
            }
          }
        }

        if(currentState === 'ENDLEVEL'){
            //player.onUpdate()
        }
      }
      /******************/

      /******************/
      function endLevel(){
        let game = phaserMaster.game();
        let {gameData, dialogPortraits} = phaserMaster.getOnly(['gameData', 'dialogPortraits']);
        let {player} = phaserSprites.getOnly(['player'])
        phaserControls.disableAllActionButtons();
        phaserControls.disableAllDirectionalButtons();

        game.time.events.add(5000, () => {
          let lettering = buildLetteringSprites('mission', 10, 1.1);
          lettering.y = lettering.y - 100
          lettering.children.map(obj => {
            obj.reveal()
          })

          let sublettering = buildLetteringSprites('clear', 10, 1.1);
          sublettering.y = lettering.y + 80
          sublettering.children.map(obj => {
            obj.reveal()
          })

          game.time.events.add(3000, () => {
            [...lettering.children, ...sublettering.children].map(obj => {
              obj.hide()
            })


            let script = [
              {text: 'Great job Hadrion.  Another successful run.  Prepare for docking sequence.', portrait: dialogPortraits.MOTHERSHIP},
              {text: 'Hehe aww yeah.', portrait: dialogPortraits.PLAYER},
              {text: 'Don\'t make this weird.', portrait: dialogPortraits.MOTHERSHIP},
              {text: '... sorry.', portrait: dialogPortraits.PLAYER}
            ]
            dialogManager.start(script, () => {

              phaserSprites.getGroup('ui').map(obj => {
                obj.hide()
              })

              let mothership = phaserSprites.get('mothership')
              mothership.docksequence(player, () => {

                 game.time.events.add(150, () => {
                       phaserMaster.changeState('ENDLEVEL');
                       shakeWorld(0.0, 1)
                       let bmd = game.add.bitmapData(game.width, game.height);
                           bmd.drawFull(game.world);
                       var bmdImage = bmd.addToWorld(game.world.centerX + 100, game.world.centerY + 100, 0.5, 0.5, 2, 2);
                       phaserGroup.add(5, bmdImage)

                       phaserSprites.getManyGroups(['backgrounds', 'starfield', 'gameobjects']).map(obj => {
                         obj.destroy()
                       })

                       utilityManager.overlayBGControls({transition: 'FLASHWHITE', delay: 0, speed: 600}, () => {

                         bmdImage.scale.setTo(0.5, 0.5)
                         bmdImage.x = game.world.centerX
                         bmdImage.y = game.world.centerY
                         game.stage.backgroundColor = '#f2f2f2';

                         tweenTint(bmdImage, 0x000000, 0xffffff, 3000, () => {
                           phaserControls.enableAllActionButtons();
                           phaserControls.enableAllDirectionalButtons();

                           let {menuButton1, menuButton2} = phaserSprites.getOnly(['menuButton1', 'menuButton2'])
                           phaserMaster.changeState('VICTORYSTATE');
                           phaserSprites.getGroup('menuButtons').map(obj => {
                             obj.reveal()
                           })
                           menuButton1.text.setText('NEXT STAGE')
                           menuButton2.text.setText('SAVE AND QUIT')

                         });

                       })
                     }).autoDestroy = true;

              })

            })

          })
        })

        // phaserSprites.get('player').playEndSequence(() => {
        //     phaserMaster.changeState('ENDLEVEL');
        //
        //     // add any last second images
        //     //createExplosion(game.world.centerX, game.world.centerY, 4, 8)
        //
        //     // minor delay to capture them
        //     game.time.events.add(150, () => {
        //       let bmd = game.add.bitmapData(game.width, game.height);
        //           bmd.drawFull(game.world);
        //       var bmdImage = bmd.addToWorld(game.world.centerX + 100, game.world.centerY + 100, 0.5, 0.5, 2, 2);
        //       phaserGroup.add(5, bmdImage)
        //
        //       phaserSprites.getManyGroups(['backgrounds', 'starfield', 'gameobjects']).map(obj => {
        //         obj.destroy()
        //       })
        //
        //       utilityManager.overlayBGControls({transition: 'FLASHWHITE', delay: 0, speed: 600}, () => {
        //
        //         bmdImage.scale.setTo(0.5, 0.5)
        //         bmdImage.x = game.world.centerX
        //         bmdImage.y = game.world.centerY
        //
        //         tweenTint(bmdImage, 0x000000, 0xffffff, 3000, () => {
        //           phaserControls.enableAllInput();
        //
        //           let {menuButton1, menuButton2} = phaserSprites.getOnly(['menuButton1', 'menuButton2'])
        //           phaserMaster.changeState('VICTORYSTATE');
        //           phaserSprites.getGroup('menuButtons').map(obj => {
        //             obj.reveal()
        //           })
        //           menuButton1.text.setText('NEXT STAGE')
        //           menuButton2.text.setText('SAVE AND QUIT')
        //
        //         });
        //
        //       })
        //     }).autoDestroy = true;
        // })
      }
      /******************/

      /******************/
      function victoryScreenSequence(callback:any){
        // let game = phaserMaster.game();
        // let gameData = phaserMaster.get('gameData');
        //
        //
        // let victoryScreenContainer = phaserSprites.addFromAtlas({y: game.world.centerY - 100, name: `victoryScreenContainer`, group: 'ui_clear', filename: 'ui_clear', atlas: 'atlas_main', visible: false})
        //     victoryScreenContainer.anchor.setTo(0.5, 0.5)
        //     victoryScreenContainer.reveal = function(){
        //       this.x = -this.width - 100
        //       this.visible = true
        //       this.game.add.tween(this).to( { x: this.game.world.centerX }, Phaser.Timer.SECOND*1, Phaser.Easing.Bounce.Out, true, 0, 0, false).
        //         onComplete.add(() => {
        //
        //           let scoreContainer = phaserSprites.addFromAtlas({x: this.game.world.centerX, y: this.game.world.centerY, name: `scoreContainer2`, group: 'ui', filename: 'ui_roundContainer', atlas: 'atlas_main', visible: true})
        //               scoreContainer.anchor.setTo(0.5, 0.5)
        //           let scoreText = phaserTexts.add({name: 'scoreText2', group: 'ui_text', x:scoreContainer.x, y: scoreContainer.y,  font: 'gem', size: 14, default: `${gameData.score}`})
        //               scoreText.anchor.setTo(0.5, 0.5)
        //               scoreText.updateScore = function(){
        //                 this.setText(`${phaserMaster.get('gameData').score}`)
        //               }
        //               phaserGroup.addMany(12, [scoreContainer])
        //               phaserGroup.addMany(13, [scoreText])
        //v
        //           let population = phaserMaster.get('gameData').population
        //           let leftText = phaserTexts.add({name: 'popLeft', group: 'ui', font: 'gem', x: this.x, y: this.y - 10,  size: 24, default: `PEOPLE SAVED:`, alpha: 0})
        //               leftText.anchor.setTo(0.5, 0.5)
        //               leftText.scale.setTo(2, 2)
        //               leftText.game.add.tween(leftText.scale).to( { x: 1, y: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //               leftText.game.add.tween(leftText).to( { alpha: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //                 .onComplete.add(() => {
        //                   setTimeout(() => {
        //                     let population = phaserMaster.get('gameData').population
        //                     let peopleCount = phaserTexts.add({name: 'popCount',  font: 'gem', x: this.x, y: this.y + 30,  size: 45, default: ``, alpha: 0})
        //                         peopleCount.anchor.setTo(0.5, 0.5)
        //                         peopleCount.scale.setTo(1.5, 1.5)
        //                         peopleCount.setText(`${(population.total - population.killed)* 700000}`)
        //                         peopleCount.game.add.tween(peopleCount.scale).to( { x: 1, y: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //                         peopleCount.game.add.tween(peopleCount).to( { alpha: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //
        //                         phaserGroup.addMany(13, [peopleCount])
        //
        //                         let totalCount = (population.total - population.killed)* 700000;
        //                         let countBy = 543211
        //                         let medalsEarned = 0
        //                         let totalSaved = 0
        //                         let countInterval = setInterval(() => {
        //                             if(!phaserMaster.get('pauseStatus')){
        //                               if(countBy > totalCount){
        //                                 countBy = Math.round(countBy/2)
        //                               }
        //                               if(totalCount - countBy <= 0){
        //                                 peopleCount.setText(0)
        //                                 clearInterval(countInterval)
        //
        //
        //                                 setTimeout(() => {
        //                                   leftText.setText('MEDALS EARNED')
        //                                   phaserTexts.destroy('popCount')
        //
        //                                   for(let i = 0; i < medalsEarned; i++){
        //                                     let medal = phaserSprites.addFromAtlas({ name: `medal_${i}`, group: 'medals', x: victoryScreenContainer.x + (i*20) - 80, y: victoryScreenContainer.y + 20, width: game.world.width, height: game.world.height, atlas: 'atlas_main', filename: 'medal_gold', alpha: 0 });
        //                                         medal.reveal = function(){
        //                                           this.scale.setTo(2, 2)
        //                                           this.game.add.tween(this.scale).to( { x: 1, y: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //                                           this.game.add.tween(this).to( { alpha: 1}, 100, Phaser.Easing.Linear.Out, true, 0)
        //                                         }
        //                                         phaserGroup.addMany(13, [medal])
        //                                         setTimeout(() => {
        //                                           medal.reveal();
        //                                         }, i*50)
        //                                   }
        //

        //                               }
        //                               else{
        //                                 totalSaved += countBy
        //                                 if(totalSaved > 10000000){
        //                                   saveData('score', Math.round(gameData.score + 2000))
        //                                   scoreText.updateScore();
        //                                   medalsEarned++
        //                                   totalSaved = 0;
        //                                 }
        //                                 totalCount -= countBy
        //                                 peopleCount.setText(totalCount)
        //                               }
        //                             }
        //                         }, 1)
        //
        //                   }, Phaser.Timer.SECOND/2)
        //                 })
        //
        //           //phaserGroup.addMany(12, [characterPortrait])
        //         })
        //     }
        //     victoryScreenContainer.hide = function(){
        //       this.game.add.tween(this).to( { y: -this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false)
        //     }
        //     victoryScreenContainer.reveal();
        //     phaserGroup.addMany(13, [victoryScreenContainer])
      }
      /******************/

      /******************/
      function gameOver(){
        // phaserMaster.changeState('GAMEOVER');
        // let player = phaserSprites.get('player')
        // let earth = phaserSprites.get('earth')
        // phaserControls.disableAllInput();
        // phaserMaster.changeState('GAMEOVERSTATE');
        //
        // phaserSprites.getGroup('ui').map(obj => {
        //   obj.hide();
        // })
        //
        // // minor delay to capture them
        // game.time.events.add(Phaser.Timer.SECOND * 3, () => {
        //
        //   let bmd = game.add.bitmapData(game.width, game.height);
        //       bmd.drawFull(game.world);
        //   var bmdImage = bmd.addToWorld(game.world.centerX + 100, game.world.centerY + 100, 0.5, 0.5, 2, 2);
        //   phaserGroup.add(5, bmdImage)
        //
        //
        //   phaserSprites.getManyGroups(['backgrounds', 'starfield', 'gameobjects']).map(obj => {
        //     obj.destroy()
        //   })
        //
        //   utilityManager.overlayBGControls({transition: 'FLASHWHITE', delay: 0, speed: 600}, () => {
        //
        //     bmdImage.scale.setTo(0.5, 0.5)
        //     bmdImage.x = 0
        //     bmdImage.y = 0
        //
        //     let newsPaper = phaserSprites.addFromAtlas({x: game.world.centerX, y: game.world.centerY, width: game.world.width, height: game.world.height, name: `newspaper`, group: 'gameobjects', filename: 'newspaper', atlas: 'atlas_main', visible: true})
        //         newsPaper.anchor.setTo(0.5, 0.5)
        //         newsPaper.scale.setTo(3, 3)
        //         newsPaper.addChild(bmdImage)
        //         phaserGroup.add(6, newsPaper)
        //
        //     tweenTint(bmdImage, 0x000000, 0xffffff, 3000, () => {
        //       phaserControls.enableAllInput();
        //
        //       let {menuButton1, menuButton2} = phaserTexts.getOnly(['menuButton1', 'menuButton2'])
        //       phaserSprites.getGroup('menuButtons').map(obj => {
        //         obj.reveal()
        //       })
        //
        //       menuButton1.text.setText('RETRY')
        //       menuButton2.text.setText('SAVE AND QUIT')
        //
        //     });
        //     game.add.tween(newsPaper.scale).to( { x: 1, y: 1 }, Phaser.Timer.SECOND*1.5, Phaser.Easing.Bounce.Out, true, 0, 0, false)
        //     game.add.tween(newsPaper).to( { angle: 35, y: newsPaper.y - 50 }, Phaser.Timer.SECOND*1.5, Phaser.Easing.Linear.InOut, true, 0, 0, false)
        //   })
        // }).autoDestroy = true;
      }
      /******************/

      /******************/
      function finalFadeOut(callback:any){
        utilityManager.overlayBGControls({transition: 'FADEIN', delay: 0, speed: 250}, () => {

            // hide UI text
            phaserTexts.getManyGroups(['ui', 'ui_text', 'ui_buttons']).map(text => {
              phaserTexts.destroy(text.name)
            })

            phaserSprites.getManyGroups(['ui', 'ui_buttons']).map(obj => {
              phaserSprites.destroy(obj.name)
            })

            overlayControls('WIPEIN', () => {
              game.time.events.add(300, () => {
                callback();
              }).autoDestroy = true;
            })
          })
      }

      function nextLevel(){
        finalFadeOut(() => {
          updateStore();
          parent.loadNextLevel()
        })
      }

      function retryLevel(){
        finalFadeOut(() => {
          parent.retry()
        })
      }

      function resetGame(){
        finalFadeOut(() => {
          parent.returnToTitle()
        })
      }

      function saveAndQuit(){
        finalFadeOut(() => {
          updateStore();
          parent.returnToTitle()
        })
      }
      /******************/

      /******************/
      /*  DO NOT TOUCH */
      parent.game = this;                 // make game accessible to parent element
      this.game = phaserMaster.game();    // make accessible to class functions
      /******************/
    }
    /******************/

    /******************/
    public destroy(){
      this.game.destroy();
    }
    /******************/

}

let __phaser = new PhaserGameObject();
