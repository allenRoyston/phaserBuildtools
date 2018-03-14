declare var Phaser:any;

// imports must be added in gulpFile as well
//removeIf(gameBuild)
import {PHASER_MASTER} from './exports/master'
import {PHASER_CONTROLS} from './exports/controller'
import {PHASER_MOUSE} from './exports/mouse'
import {PHASER_AUDIO} from './exports/audio'
import {PHASER_PRELOADER} from './exports/preloader'
import {PHASER_SPRITE_MANAGER} from './exports/spriteManager'
import {PHASER_TEXT_MANAGER} from './exports/textManager'
import {PHASER_BUTTON_MANAGER} from './exports/buttonManager'
import {PHASER_BITMAPDATA_MANAGER} from './exports/bitmapdataManager'
import {PHASER_GROUP_MANAGER} from './exports/groupManager'
//endRemoveIf(gameBuild)

class PhaserGameObject {
    // this properties
    global:any;
    game:any;

    /******************/
    constructor(){
      // accessible in gameObject as _this, accessible in class functions as this (obviously)
      this.game = null;
      this.global = {
        pause: false
      };
    }
    /******************/

    /******************/
    public init(el:any, parent:any, options:any){

      /******************/
      // declare variables BOILERPLATE
      // initiate control class
      const phaserMaster = new PHASER_MASTER({game: new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update}), resolution: {width: options.width, height: options.height}}),
            phaserControls = new PHASER_CONTROLS(),
            phaserMouse = new PHASER_MOUSE({showDebugger: false}),
            phaserSprites = new PHASER_SPRITE_MANAGER(),
            phaserBmd = new PHASER_BITMAPDATA_MANAGER(),
            phaserTexts = new PHASER_TEXT_MANAGER(),
            phaserButtons = new PHASER_BUTTON_MANAGER(),
            phaserGroup = new PHASER_GROUP_MANAGER(),
            phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER();

      const store = options.store;
      phaserMaster.let('gameData', store.getters._gameData())
      /******************/

      /******************/
      function saveData(prop:string, value:any){
        let gameData = phaserMaster.get('gameData')
          gameData[prop] = value;
          store.commit('setGamedata', gameData)
      }
      /******************/

      /******************/
      function preload(){
        let game = phaserMaster.game();
        // load resources in parellel
        game.load.enableParallel = true;

        // set canvas color
        game.stage.backgroundColor = '#2f2f2f';

        // images
        let folder = 'src/phaser/saveTheWorld/resources'
        game.load.image('background', `${folder}/images/starfield.png`);
        game.load.atlas('atlas_main', `${folder}/spritesheets/main/main.png`, `${folder}/spritesheets/main/main.json`, Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
        game.load.atlas('atlas_space', `${folder}/spritesheets/space/space.png`, `${folder}/spritesheets/space/space.json`, Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);

        // load music into buffer
        // game.load.audio('music-main', ['src/assets/game/demo1/music/zombies-in-space.ogg']);
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
      function generateHexColor() {
        return '#' + ((0.5 + 0.5 * Math.random()) * 0xFFFFFF << 0).toString(16);
      }

      function tweenTint(obj, startColor, endColor, time) {    // create an object to tween with our step value at 0
        let game = phaserMaster.game();
        let colorBlend = {step: 0};    // create the tween on this object and tween its step property to 100
        let colorTween = game.add.tween(colorBlend).to({step: 100}, time);
         // run the interpolateColor function every time the tween updates, feeding it the
         // updated value of our tween each time, and set the result as our tint
         colorTween.onUpdateCallback(() => {
           obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
         });
         // set the object to the start color straight away
         obj.tint = startColor;
          // start the tween
         colorTween.start();
      }

      /******************/

      /******************/
      function create(){
        let game = phaserMaster.game();
        let gameData = phaserMaster.get('gameData')

        // assign game to classes
        phaserControls.assign(game)
        phaserMouse.assign(game)
        phaserSprites.assign(game)
        phaserBmd.assign(game)
        phaserTexts.assign(game)
        phaserButtons.assign(game)
        phaserGroup.assign(game, 15)
        phaserBitmapdata.assign(game)

        // game variables
        phaserMaster.let('score', gameData.score)
        phaserMaster.let('roundTime', 30)
        phaserMaster.let('clock', game.time.create(false))
        phaserMaster.let('elapsedTime', 0)
        phaserMaster.let('devMode', true)
        phaserMaster.let('starMomentum', {x: 0, y:0})
        phaserMaster.let('population', {total: gameData.population.total, killed: gameData.population.killed})

        // weapon data
        let weaponData = game.cache.getJSON('weaponData');
        let pw = phaserMaster.let('primaryWeapon', weaponData.primaryWeapons[gameData.primaryWeapon])
        let sw = phaserMaster.let('secondaryWeapon', weaponData.secondaryWeapons[gameData.secondaryWeapon])

        // pause behavior
        game.onPause.add(() => {
          pauseGame()
        }, this);
        game.onResume.add(() => {
          unpauseGame();
        }, this);

        // // filter
        // game.physics.startSystem(Phaser.Physics.ARCADE);
        // var fragmentSrc = [
        //     "precision mediump float;",
        //     "uniform float     time;",
        //     "uniform vec2      resolution;",
        //     "uniform sampler2D iChannel0;",
        //     "void main( void ) {",
        //         "float t = time;",
        //         "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        //         "vec2 texcoord = gl_FragCoord.xy / vec2(resolution.y);",
        //         "texcoord.y -= t*0.2;",
        //         "float zz = 1.0/(1.0-uv.y*1.7);",
        //         "texcoord.y -= zz * sign(zz);",
        //         "vec2 maa = texcoord.xy * vec2(zz, 1.0) - vec2(zz, 0.0) ;",
        //         "vec2 maa2 = (texcoord.xy * vec2(zz, 1.0) - vec2(zz, 0.0))*0.3 ;",
        //         "vec4 stone = texture2D(iChannel0, maa);",
        //         "vec4 blips = texture2D(iChannel0, maa);",
        //         "vec4 mixer = texture2D(iChannel0, maa2);",
        //         "float shade = abs(1.0/zz);",
        //         "vec3 outp = mix(shade*stone.rgb, mix(1.0, shade, abs(sin(t+maa.y-sin(maa.x))))*blips.rgb, min(1.0, pow(mixer.g*2.1, 2.0)));",
        //         "gl_FragColor = vec4(outp,1.0);",
        //     "}"
        // ];
        //
        // //  Texture must be power-of-two sized or the filter will break
        // let sprite =  phaserSprites.add({x: 0, y: 0, name: `filterBG`, group: 'filter', reference: 'background'})
        //     sprite.width = game.world.width;
        //     sprite.height = game.world.height;
        // let filter = phaserMaster.let('filter', new Phaser.Filter(game, {iChannel0: { type: 'sampler2D', value: sprite.texture, textureData: { repeat: true } }}, fragmentSrc))
        //     filter.setResolution(1920, 1080);
        // sprite.filters = [ filter ];
        // phaserGroup.add(0, sprite)

        var background = phaserSprites.addTilespriteFromAtlas({ name: 'background', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_space', filename: 'spacebg.png' });
            background.count = 0;
            background.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.y -= Math.sin(this.count) * 0.2;
            };
        phaserGroup.add(0, background)

        // particles (from atlas)
        let emitter = phaserMaster.let('emitter', game.add.emitter(game, 0, 0, 5000))
            emitter.makeParticles('atlas_main', 'particle.png');
            emitter.gravity = 0;
            phaserGroup.layer(1).add(emitter)

        // stars
        //let stars = phaserBmd.addGradient({name: 'starBmp', group: 'blockBmpGroup', start: '#ffffff', end: '#ffffff', width: 1, height: 1, render: false})
        for (var i = 0; i < 25; i++){
            let star = phaserSprites.addFromAtlas({x: game.rnd.integerInRange(0, game.world.width), y:game.rnd.integerInRange(0, game.world.height), name: `star_${i}`, group: 'movingStarField', filename: `stars_layer_${game.rnd.integerInRange(1, 3)}.png`, atlas: 'atlas_main', visible: true})
                star.starType = game.rnd.integerInRange(1, 3);
                star.scale.setTo(star.starType/2, star.starType/2);
                star.onUpdate = function(){
                  let baseMomentum = 0.25 + (3 - star.starType)*5
                  let starMomentum = phaserMaster.get('starMomentum')
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

                  this.x += (3 - star.starType)*starMomentum.x
                  this.y += (baseMomentum + ((3 - star.starType)*starMomentum.y))
                }
                star.fadeOut = function(){
                  this.game.add.tween(this).to( { alpha: 0 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).autoDestroy = true;
                }
                phaserGroup.layer(4 - star.starType).add(star)
        }

        var nebula1 = phaserSprites.addTilespriteFromAtlas({ name: 'nebula1', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_space', filename: 'Nebula1.png' });
            nebula1.count = 0;
            nebula1.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.x -= Math.sin(this.count) * 0.2;
            };

        var nebula2 = phaserSprites.addTilespriteFromAtlas({ name: 'nebula2', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_space', filename: 'Nebula2.png' });
            nebula2.count = 0;
            nebula2.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.y += 0.2
                this.tilePosition.x += 0.2
            };

        let earth = phaserSprites.addFromAtlas({x: this.game.world.centerX, y: this.game.canvas.height + 400, name: `earth`, group: 'spaceGroup', filename: 'earth.png', atlas: 'atlas_space', visible: true})
            earth.scale.setTo(2, 2)
            earth.anchor.setTo(0.5, 0.5)
            earth.onUpdate = function(){
              earth.angle +=0.01
            }
            earth.fadeOut = function(){
              this.game.add.tween(this).to( { y: this.y + 200, alpha: 1 }, Phaser.Timer.SECOND*9, Phaser.Easing.Linear.Out, true, 0, 0, false).autoDestroy = true;
            }
            earth.selfDestruct = function(){
              tweenTint(this, this.tint, 1*0xff0000, Phaser.Timer.SECOND*8);
              for(let i = 0; i < 100; i++){
                setTimeout( () => {
                  createExplosion(game.rnd.integerInRange(0, this.game.canvas.width), game.rnd.integerInRange(this.game.canvas.height - 200, this.game.canvas.height), 0.25)
                }, 100 * i)
              }
            }

            phaserGroup.addMany(2, [earth])
            phaserGroup.addMany(1, [nebula1, nebula2])


        //  UI
        var timeContainer = phaserSprites.addFromAtlas({name: `timerContainer`, group: 'ui', filename: 'ui_container1.png', atlas: 'atlas_main', visible: false})
            phaserSprites.centerOnPoint('timerContainer', this.game.world.centerX, -200)
            timeContainer.reveal = function(){
              this.visible = true
              this.game.add.tween(this).to( { y: 5 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                onComplete.add(() => {
                  let timeKeeper = phaserTexts.add({y: 16, name: 'timeKeeper', group: 'ui_text', font: 'gem', size: 42, default: `00`, visible: false})
                      timeKeeper.reveal = function(){
                        this.x = this.game.world.centerX - 20
                        this.visible = true
                        this.alpha = 0
                        this.game.add.tween(this).to( { alpha: 1 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.In, true, 0, 0, false);
                        phaserGroup.add(15, this)
                      }
                      timeKeeper.onUpdate = function(){
                        let totalTime = phaserMaster.get('elapsedTime');
                        let elapsedTime = phaserMaster.get('elapsedTime');
                            elapsedTime += (phaserMaster.get('clock').elapsed * .001);
                        phaserMaster.forceLet('elapsedTime', elapsedTime);
                        let roundTime = phaserMaster.get('roundTime');

                        let inSeconds = parseInt((roundTime - elapsedTime).toFixed(0))
                        if(inSeconds >= 0){
                             this.setText(`${inSeconds}`)
                        }
                        else{
                          endLevel()
                        }
                      }
                      timeKeeper.hide = function(){
                        this.game.add.tween(this).to( { alpha: 0 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                      }
                      timeKeeper.reveal();
                })


            }
            timeContainer.hide = function(){
              this.game.add.tween(this).to( { y: -200 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false)
              phaserTexts.get('timeKeeper').hide();
            }

        var roundContainer = phaserSprites.addFromAtlas({name: `roundContainer`, group: 'ui', filename: 'ui_container2.png', atlas: 'atlas_main', visible: false})
            roundContainer.reveal = function(){
              this.x = this.game.world.width - this.width - 10
              this.y = -200
              this.visible = true
              this.game.add.tween(this).to( { y: 5 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                onComplete.add(() => {
                  let roundText = phaserTexts.add({name: 'roundText', group: 'ui_text', x:game.world.width - 70, y:10,  font: 'gem', size: 12, default: `Round ${gameData.level}`, visible: false})
                      roundText.reveal = function(){
                        this.visible = true
                        this.alpha = 0;
                        this.game.add.tween(this).to( { alpha: 1 }, Phaser.Timer.SECOND/2, Phaser.Easing.Linear.In, true, 0, 0, false);
                        phaserGroup.add(15, this)
                      }
                      roundText.hide = function(){
                        this.game.add.tween(this).to( { alpha: 0 }, Phaser.Timer.SECOND, Phaser.Easing.Linear.Out, true, 0, 0, false);
                      }
                      roundText.reveal();
                })
            }
            roundContainer.hide = function(){
              this.game.add.tween(this).to( { y: -200 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false)
              phaserTexts.get('roundText').hide();
            }

        var healthContainer = phaserSprites.addFromAtlas({name: `healthContainer`, group: 'ui', filename: 'ui_healthbar.png', atlas: 'atlas_main', visible: false})
            healthContainer.reveal = function(){
              this.x = -this.width;
              this.y = this.game.world.height - this.height - 10
              this.visible = true
              this.game.add.tween(this).to( { x: 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                onComplete.add(() => {
                  let healthBar = phaserSprites.addFromAtlas({x: healthContainer.x + 84, y: healthContainer.y + 46, name: `healthBar`, group: 'ui_overlay', filename: 'ui_health.png', atlas: 'atlas_main', visible: true})
                  let maskhealth = phaserMaster.let('healthBar', phaserSprites.addBasicMaskToSprite(healthBar))
                      maskhealth.x = -healthBar.width;
                      updateShipHealthbar(100)

                  let specialBar = phaserSprites.addFromAtlas({x: healthContainer.x + 84, y: healthContainer.y + 26, name: `specialBar`, group: 'ui_overlay', filename: 'specialBar.png', atlas: 'atlas_main', visible: true})
                  let maskspecial = phaserMaster.let('specialBar', phaserSprites.addBasicMaskToSprite(specialBar))
                      maskspecial.x = -specialBar.width;
                      updateShipSpecial(100)

                  let specialWeapon = phaserSprites.addFromAtlas({x: healthContainer.x + 32, y: healthContainer.y + 32, name: `specialWeapon`, group: 'ui_overlay', filename: 'clusterBomb.png', atlas: 'atlas_main', visible: true})
                      specialWeapon.anchor.setTo(0.5, 0.5)
                      specialWeapon.scale.setTo(1.5, 1.5)
                      specialWeapon.onUpdate = function(){
                        this.angle += 2
                      }
                      specialWeapon.reveal= function(){
                        // this.visible = true
                        // this.game.add.tween(this).to( { x: 30 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false);
                      }
                      specialWeapon.hide= function(){
                        this.visible = false;
                        // this.game.add.tween(this).to( { x: -150 }, Phaser.Timer.SECOND, Phaser.Easing.Back.OutIn, true, 0, 0, false);
                      }
                      specialWeapon.onPress= function(delay:number){
                        // let spt = phaserTexts.get('specialWeaponText')
                        // this.alpha = 0.25;
                        // spt.alpha = 0.5
                        // spt.setText('Reloading...')
                        // this.game.add.tween(this).to( { alpha: 1 }, delay - 50, Phaser.Easing.Linear.In, true, 0, 0, false);
                        // game.time.events.add(delay - 50, () => {
                        //   this.alpha = 1;
                        //   spt.alpha = 1
                        //   spt.resetText()
                        // }, this);
                      }
                      specialWeapon.reveal()

                      phaserGroup.addMany(14, [healthBar, specialBar, specialWeapon])
                })
            }
            healthContainer.hide = function(){
              updateShipSpecial(0)
              updateShipHealthbar(0)
              phaserSprites.getGroup('ui_overlay').forEach((obj) => {
                obj.hide();
              })
              this.game.add.tween(this).to( { y: this.game.world.height + this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false)
            }

        var earthContainer = phaserSprites.addFromAtlas({name: `earthContainer`, group: 'ui', filename: 'ui_shield.png', atlas: 'atlas_main', visible: false})
            earthContainer.reveal = function(){
              this.x = this.game.world.width + this.width;
              this.y = this.game.world.height - this.height - 10
              this.visible = true
              this.game.add.tween(this).to( { x: this.game.world.width - this.width - 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                onComplete.add(() => {
                  this.defaultPosition.x = this.x
                  this.defaultPosition.y = this.y

                  let earthBar = phaserSprites.addFromAtlas({x: earthContainer.x + 5, y: earthContainer.y + 5, name: `earthBar`, group: 'ui_overlay', filename: 'earthBar.png', atlas: 'atlas_main', visible: true})
                  let maskhealth = phaserMaster.let('earthBar', phaserSprites.addBasicMaskToSprite(earthBar))
                      maskhealth.x = -earthBar.width;
                      updateEarthbar(100)
                })
            }
            earthContainer.hide = function(){
              updateEarthbar(0)
              this.game.add.tween(this).to( { y: this.game.world.height + this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false)
            }
            earthContainer.takeDamage = function(){
              this.game.add.tween(this).to( { x: this.defaultPosition.x - 5 }, 50, Phaser.Easing.Bounce.In, true, 0, 0, false).
                onComplete.add(() => {
                  this.game.add.tween(this).to( { x: this.defaultPosition.x + 3 }, 50, Phaser.Easing.Bounce.Out, true, 0, 0, false)
                    .onComplete.add(() => {
                      this.game.add.tween(this).to( { x: this.defaultPosition.x }, 50, Phaser.Easing.Bounce.InOut, true, 0, 0, false)
                    })
                })
            }
            phaserGroup.addMany(13, [timeContainer, healthContainer, roundContainer, earthContainer])





        // SCORE
        let scoreText = phaserTexts.add({name: 'scoreText', group: 'ui', x:10, y:10,  font: 'gem', size: 18, default: `Score: ${phaserMaster.get('score')}`, visible: false})
            scoreText.onUpdate = function(){}
            scoreText.updateScore = function(){
              //this.setText(`Score: ${phaserMaster.get('score')}`)
            }
            scoreText.reveal = function(){
              // this.y = -this.height;
              // this.visible = true
              // game.add.tween(this).to( { y: 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false);
            }
            scoreText.hide = function(){
              // game.add.tween(this).to( { y: -100 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false);
            }


        // HEALTH TEXT
        let healthText = phaserTexts.add({name: 'healthText', group: 'ui', font: 'gem', x: 15, y: game.canvas.height - 23, size: 16, default: '', visible: false})
            healthText.onUpdate = function(){
              //let pop = phaserMaster.get('population')
              //this.setText(`Population: ${(pop.total - pop.killed)* 7000000}`)
            }
            healthText.reveal = function(){
              // this.x = -this.width;
              // this.visible = true
              // this.game.add.tween(this).to( { x: 15 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false);
            }
            healthText.hide = function(){
              //this.game.add.tween(this).to( { x: -this.width - 100}, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false);
            }

        // add texts to layers
        phaserGroup.addMany(15, [scoreText])

        let overlaybmd = phaserBitmapdata.addGradient({name: 'overlaybmd', start: '#2f2f2f', end: '#2f2f2f', width: 5, height: 5, render: false})
        let overlay = phaserSprites.add({x: 0, y: 0, name: `overlay`, reference: overlaybmd.cacheBitmapData, visible: true})
            overlay.width = game.canvas.width;
            overlay.height = game.canvas.height;
            overlay.fadeIn = function(duration:number, callback:any){
              game.add.tween(this).to( { alpha: 1 }, duration, Phaser.Easing.Linear.In, true, 0, 0, false);
              setTimeout(() => {
                callback();
              }, duration)
            }
            overlay.fadeOut = function(duration:number, callback:any){
              game.add.tween(this).to( { alpha: 0 }, duration, Phaser.Easing.Linear.Out, true, 0, 0, false);
              setTimeout(() => {
                callback();
              }, duration)
            }
            phaserGroup.addMany(10, [overlay])

      }
      /******************/

      /******************/
      function preloadComplete(){
        let game = phaserMaster.game();
        let isDevMode = phaserMaster.get('devMode')

        // create player
        let player = createPlayer();

        phaserSprites.get('overlay').fadeOut(isDevMode ? 0 : Phaser.Timer.SECOND/2, () => {

            playSequence('SAVE THE WORLD', ()=>{
              player.moveToStart();
              game.time.events.add(isDevMode ? Phaser.Timer.SECOND*0 : Phaser.Timer.SECOND*1, () => {
              playSequence(`${phaserMaster.get('roundTime')} SECONDS GO`, () => {
                  game.time.events.add(isDevMode ? Phaser.Timer.SECOND*0 : Phaser.Timer.SECOND/2, () => {
                    phaserSprites.getGroup('ui').forEach((sprite) => {
                      sprite.reveal()
                    })

                  }).autoDestroy = true;

                  // start clock
                  phaserMaster.get('clock').start()
                  // change state
                  phaserMaster.changeState('READY');
                })
              })
            })
        })
      }
      /******************/

      /******************/
      function updateShipHealthbar(remaining:number, immediate:boolean = false, duration:number = Phaser.Timer.SECOND/3){
        let game = phaserMaster.game();
        let mask = phaserMaster.get('healthBar')
        let bars = Math.ceil(30 * (remaining*.01))
        let tween = phaserMaster.get('healthBarTween')
        if(tween !== null){
          tween.stop()
        }
        phaserMaster.forceLet('healthBarTween', game.add.tween(mask).to( { x: -231 + (7.7*bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false))
      }
      /******************/

      /******************/
      function updateShipSpecial(remaining:number, immediate:boolean = false, duration:number = Phaser.Timer.SECOND/3){
        let game = phaserMaster.game();
        let mask = phaserMaster.get('specialBar')
        let bars = Math.ceil(6 * (remaining*.01))
        let tween = phaserMaster.get('specialBarTween')
        if(tween !== null){
          tween.stop()
        }
        phaserMaster.forceLet('specialBarTween', game.add.tween(mask).to( { x: -48 + (8*bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false))
      }
      /******************/

      /******************/
      function updateEarthbar(remaining:number, immediate:boolean = false, duration:number = Phaser.Timer.SECOND/3){
        let game = phaserMaster.game();
        let mask = phaserMaster.get('earthBar')
        let bars = (10 * (remaining*.01))
        let tween = phaserMaster.get('earthBarTween')
        if(tween !== null){
          tween.stop()
        }                
        phaserMaster.forceLet('earthBarTween', game.add.tween(mask).to( { x: -244 + (24.4*bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false))
      }
      /******************/

      function earthTakeDamage(val:number){
        let population = phaserMaster.get('population')
            population.killed += val
        let damageTaken = 100 - ((population.killed/population.total) * 100)
        phaserSprites.get('earthContainer').takeDamage();
        updateEarthbar(damageTaken, true)
        phaserMaster.forceLet('population', population)
      }

      /******************/
      function playSequence(wordString:String, callback:any){
        let game = phaserMaster.game();

          let wordlist = wordString.split(" ");

          wordlist.forEach( (word, index) => {
            let splashText = phaserTexts.add({name: `splashText_${game.rnd.integer()}`, group: 'splash', font: 'gem', size: 18, default: word, visible: false})
                splashText.startSplash = function(){
                  this.visible = true;
                  this.scale.setTo(10, 10)
                  phaserTexts.alignToCenter(this.name)
                  game.add.tween(this.scale).to( { x:0.5, y:0.5}, 350, Phaser.Easing.Linear.In, true, 0);
                  game.add.tween(this).to( { x: this.game.world.centerX, y: this.game.world.centerY, alpha: 0.75}, 350, Phaser.Easing.Linear.In, true, 0)
                  setTimeout(() => {
                    phaserTexts.destroy(this.name)
                  }, 350)
                }
                game.time.events.add((Phaser.Timer.SECOND/2.5 * index) + 100, splashText.startSplash, splashText).autoDestroy = true;
          })

          game.time.events.add(Phaser.Timer.SECOND/2.5 * wordlist.length, callback, this).autoDestroy = true;

      }

      /******************/
      function createShipExhaust(){
        let shipExhaust = phaserSprites.addFromAtlas({name: 'exhaust', group: 'playership', atlas: 'atlas_main',  filename: 'exhaust_red_1.png', visible: false})
            shipExhaust.animations.add('exhaust_animation', Phaser.Animation.generateFrameNames('exhaust_red_', 1, 8, '.png'), 1, true)
            shipExhaust.animations.play('exhaust_animation', 30, true)
            phaserGroup.add(8, shipExhaust)

            shipExhaust.onUpdate = function(){
              let player = phaserSprites.get('player')
              let {x, width, height, y, visible} = player;
              this.visible = !phaserMaster.checkState('ENDLEVEL') ? visible : false;
              this.x = x - 17
              this.y = y + 8;
            }

            shipExhaust.updateCords = function(x, y){
              this.x = x - 17
              this.y = y + 8;
            }

            shipExhaust.destroyIt = function(){
              phaserSprites.destroy('exhaust')
            }

      }
      /******************/

      /******************/
      function createPlayer(){
        let game = phaserMaster.game();

        //  The hero!
        let player = phaserSprites.addFromAtlas({name: 'player', group: 'playership', atlas: 'atlas_main',  filename: 'ship_body.png', visible: false})
            player.anchor.setTo(0.5, 0.5);
            player.scale.setTo(1, 1)
            player.isInvincible = true;
            game.physics.enable(player, Phaser.Physics.ARCADE);
            phaserGroup.add(8, player)
            createShipExhaust();

            player.onUpdate = function(){
              if(this.visible){
                player.createTrail();
              }

            }

            player.createTrail = function(){
              let trailCount = phaserSprites.getGroup('trails').length;
              if(trailCount < phaserMaster.checkState('ENDLEVEL') ? 20 : 10){
                let trail = phaserSprites.addFromAtlas({name: `trail_${game.rnd.integer()}`, group:'trails', x: this.x, y: this.y, filename: 'ship_body.png', atlas: 'atlas_main', visible: true})
                    trail.anchor.setTo(0.5, 0.5)
                    trail.scale.setTo(this.scale.x, this.scale.y)
                    trail.alpha = 0.6
                    trail.tint = 1 * 0x0000ff;
                    phaserGroup.add(7, trail)
                    trail.destroySelf = function(){
                      this.game.add.tween(this).to( { alpha: 0}, phaserMaster.checkState('ENDLEVEL') ? 400 : 100, Phaser.Easing.Linear.In, true, 0).
                        onComplete.add(() => {
                          phaserSprites.destroy(this.name)
                        }, this);
                    }
                    trail.destroySelf();
               }

            }

            player.selfDestruct = function(){
              phaserSprites.get('exhaust').destroyIt();
              game.add.tween(this.scale).to( { x: 0.25, y: 0.25}, 3400, Phaser.Easing.Linear.In, true, 0).
              game.add.tween(this).to( { angle: 720}, 3400, Phaser.Easing.Linear.In, true, 0).
                onComplete.add(() => {
                  phaserSprites.destroy(this.name)
                  createExplosion(this.x, this.y, 0.5)
                }, this);
            }

            player.moveToStart = function(){
              this.visible = true;
              this.x = this.game.world.centerX
              this.y = this.game.world.centerY + 550
              game.add.tween(this).to( { y: game.world.centerY + 200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false);
            }

            player.moveX = function(val:number){
              this.x += val
              phaserSprites.get('exhaust').updateCords(this.x, this.y)
              this.checkLimits()
            }

            player.moveY = function(val:number){
              this.y += val
              phaserSprites.get('exhaust').updateCords(this.x, this.y)
              this.checkLimits()
            }

            player.checkLimits = function(){
              if(this.y - this.height < 0){
                this.y = this.height
              }

              if(this.y + this.height > this.game.canvas.height){
                this.y = this.game.canvas.height - this.height
              }

              if(this.x < 0){
                this.x = this.game.canvas.width + this.width
              }
              if(this.x > (this.game.canvas.width + this.width)){
                this.x = 0
              }
            }

            player.playEndSequence = function(callback:any){
              // scale and animate out!
              this.game.add.tween(this.scale).to( { x:2, y: 2 }, 1500, Phaser.Easing.Exponential.InOut, true, 0, 0, false);
              this.game.add.tween(this).to( { x:this.game.world.centerX, y: this.game.world.centerY + 50 }, 1500, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                onComplete.add(() => {
                  this.game.add.tween(this).to( { y: this.game.world.height + 200 }, 1500, Phaser.Easing.Exponential.InOut, true, 250, 0, false).
                    onComplete.add(() => {
                        this.game.add.tween(this).to( { y: -200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                          onComplete.add(() => {
                            callback()
                          }, this)
                    }, this)
                }, this)
            }


          return player;

      }
      /******************/

      /******************/
      function createChipDamage(options:any){
        let game = phaserMaster.game();

        let shape = phaserBitmapdata.get('chipDamageBmp')
        let underbar = phaserSprites.add({x: options.x, y: options.y, name: `chipdamage_${game.rnd.integer()}`, group: 'chipdamage', reference: shape.cacheBitmapData, visible: true})
            underbar.width = options.width
            underbar.tweenIt = function(){
              this.game.add.tween(this).to( { width: 0 }, 250, Phaser.Easing.Linear.Out, true, 100).
              onComplete.add(() => {
                phaserSprites.destroy(this.name);
              })
            }
            underbar.tweenIt();
      }


      function createAlien(options:any){
        let game = phaserMaster.game();

        let alien = phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `alien_${game.rnd.integer()}`, group:'aliens', atlas: 'atlas_main', filename: `asteroid_mid_layer_${game.rnd.integerInRange(1, 3)}.png`, visible: true})
            alien.anchor.setTo(0.5, 0.5);
            alien.scale.setTo(1.5, 1.5);
            game.physics.enable(alien, Phaser.Physics.ARCADE);

            alien.body.velocity.y = options.iy
            alien.body.velocity.x = options.ix
            alien.angleMomentum = game.rnd.integerInRange(-5, 5)
            alien.body.bounce.setTo(1, 1);
            alien.atTarget = false;
            alien.maxHealth = 150;
            alien.health = alien.maxHealth


            alien.fallThreshold = game.rnd.integerInRange(0, 75)

            phaserGroup.add(3, alien)

            // damage it
            alien.damageIt = function(val:number){
              if(!this.atTarget){
                // let emitter = phaserMaster.get('emitter');
                //     emitter.x = this.x;
                //     emitter.y = this.y
                //     emitter.start(false, 1500, 20);
                this.health -= val;

                this.tint = 1 * 0xff0000;
                this.game.add.tween(this).to( {tint: 1 * 0xffffff}, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);

                if(this.health <= 0){
                  this.destroyIt()
                }
              }
            }

            alien.removeIt = function(){
              phaserSprites.destroy(this.name)
            }

            // destroy it
            alien.destroyIt = function(spawnMore = true){
                // add to score
                let score = phaserMaster.get('score');
                phaserMaster.forceLet('score', score += 100);

                let scoreText = phaserTexts.get('scoreText')
                    scoreText.updateScore();

                // animate it
                let tween = {
                  angle: game.rnd.integerInRange(-720, 720),
                  x: this.x - game.rnd.integerInRange(-25, 25),
                  y: this.y - game.rnd.integerInRange(5, 25),
                  alpha: .5
                }
                this.game.add.tween(this).to( tween, game.rnd.integerInRange(150, 500), Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;

               // animate death and then explode
               game.time.events.add(Phaser.Timer.SECOND/2, () => {
                  createExplosion(this.x, this.y, 1)
                  if(spawnMore){
                   for(var i = 0; i < 5; i++){
                     createTrash({
                       x: this.x,
                       y: this.y,
                       ix: game.rnd.integerInRange(-100, 100),
                       iy: -game.rnd.integerInRange(-20, 20)
                     })
                   }
                  }
                phaserSprites.destroy(this.name);
               }, this).autoDestroy = true;
            }

            alien.fallToPlanet = function(){
              this.tint = 1 * 0x000000;
              this.atTarget = true;
              this.body = null;
              this.game.add.tween(this).to( {y: this.y + 60}, Phaser.Timer.SECOND*2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
              setTimeout(() => {
                this.game.add.tween(this.scale).to( {x: 0, y: 0}, Phaser.Timer.SECOND*1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                  onComplete.add(() => {
                    this.removeIt();
                    earthTakeDamage(2);
                    createExplosion(this.x, this.y, 0.25)
                  }).autoDestroy = true;
              }, 300)
            }

            alien.checkLocation = function(){
              this.angle += alien.angleMomentum
              if(this.angleMomentum > 0){
                this.angleMomentum -= 0.002
              }
              if(this.angleMomentum < 0){
                this.angleMomentum += 0.002
              }
              if(this.y > this.height){
                if(this.body !== null){
                  this.body.collideWorldBounds = true;
                }
              }
              if(this.y > this.game.canvas.height - (75 + this.fallThreshold)){
                if(this.body !== null && !this.atTarget){
                  this.body.collideWorldBounds = false;
                  this.fallToPlanet();
                }
              }
            }

            alien.onUpdate = function(){
              this.rotate += 2
              if(!alien.atTarget){
                if(this.body !== null){
                  if(this.body.velocity.y + 2 < 100){
                    this.body.velocity.y += 2
                  }
                  if(this.body.velocity.x > 0){
                    this.body.velocity.x -= 0.2
                  }
                  if(this.body.velocity.x < 0){
                    this.body.velocity.x += 0.2
                  }
                }
                this.checkLocation();
              }
            }
      }
      /******************/

      /******************/
      function createBoss(options:any){
        let game = phaserMaster.game();

        let obj = phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `boss_${game.rnd.integer()}`, group:'boss', atlas: 'atlas_main', filename: `asteroid_large_layer_${game.rnd.integerInRange(1, 3)}.png`, visible: true})
            obj.anchor.setTo(0.5, 0.5);
            game.physics.enable(obj, Phaser.Physics.ARCADE);
            obj.body.velocity.y = options.iy
            obj.body.velocity.x = options.ix
            obj.angleMomentum = game.rnd.integerInRange(-5, 5)
            obj.body.bounce.setTo(1, 1);
            obj.atTarget = false;
            obj.maxHealth = 40000;
            obj.health = obj.maxHealth
            obj.fallThreshold = game.rnd.integerInRange(0, 75)

            phaserGroup.add(3, obj)

            // damage it
            obj.damageIt = function(val:number){
              if(!this.atTarget){
                this.health -= val;
                this.tint = 1 * 0xff0000;
                this.game.add.tween(this).to( {tint: 1 * 0xffffff}, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                if(this.health <= 0){
                  this.destroyIt()
                }
              }
            }

            obj.removeIt = function(){
              phaserSprites.destroy(this.name)
            }

            // destroy it
            obj.destroyIt = function(spawnMore = true){
                // add to score
                let score = phaserMaster.get('score');
                phaserMaster.forceLet('score', score += 100);

                let scoreText = phaserTexts.get('scoreText')
                    scoreText.updateScore();

                // animate it
                let tween = {
                  angle: 720,
                  x: this.x - game.rnd.integerInRange(-10, 10),
                  y: this.y - game.rnd.integerInRange(10, 10),
                  alpha: .15
                }
                this.game.add.tween(this).to( tween, Phaser.Timer.SECOND*2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.game.add.tween(this.scale).to( {x: 0.5, y: 0.5}, Phaser.Timer.SECOND*2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;

               // animate death and then explode
               game.time.events.add(Phaser.Timer.SECOND*2, () => {
                let {x, y} = this
                impactExplosion(x, y, 2, 100)
                phaserSprites.destroy(this.name);
               }, this).autoDestroy = true;
            }

            obj.fallToPlanet = function(){
              this.tint = 1 * 0x000000;
              this.atTarget = true;
              this.body = null;
              this.game.add.tween(this).to( {y: this.y + 60, angle: 720}, Phaser.Timer.SECOND*3, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
              setTimeout(() => {
                this.game.add.tween(this.scale).to( {x: 0, y: 0}, Phaser.Timer.SECOND*3, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                  onComplete.add(() => {
                    this.removeIt();
                    earthTakeDamage(10);
                    createExplosion(this.x, this.y, .85)
                  }).autoDestroy = true;
              }, 300)
            }

            obj.checkLocation = function(){
              this.angle += obj.angleMomentum
              if(this.angleMomentum > 0){
                this.angleMomentum -= 0.002
              }
              if(this.angleMomentum < 0){
                this.angleMomentum += 0.002
              }
              if(this.y > this.height){
                if(this.body !== null){
                  this.body.collideWorldBounds = true;
                }
              }
              if(this.y > this.game.canvas.height - (75 + this.fallThreshold)){
                if(this.body !== null && !this.atTarget){
                  this.body.collideWorldBounds = false;
                  this.fallToPlanet();
                }
              }
            }

            obj.onUpdate = function(){
              this.rotate += 2
              if(!this.atTarget){
                if(this.body !== null){
                  if(this.body.velocity.y + 1 < 25){
                    this.body.velocity.y += 1
                  }
                  if(this.body.velocity.x > 0){
                    this.body.velocity.x -= 0.2
                  }
                  if(this.body.velocity.x < 0){
                    this.body.velocity.x += 0.2
                  }
                }
                this.checkLocation();
              }
            }
      }
      /******************/

      /******************/
      function createTrash(options:any){
        let game = phaserMaster.game();

        let trash = phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `trash_${game.rnd.integer()}`, group:'trashes', atlas: 'atlas_main', filename: `asteroid_small_layer_${game.rnd.integerInRange(1, 3)}.png`, visible: true})
            trash.anchor.setTo(0.5, 0.5);
            trash.scale.setTo(1, 1);
            game.physics.enable(trash, Phaser.Physics.ARCADE);
            trash.body.velocity.y = options.iy
            trash.body.velocity.x = options.ix
            trash.angleMomentum = game.rnd.integerInRange(-5, 5)
            trash.body.bounce.setTo(1, 1);
            trash.atTarget = false;
            trash.maxHealth = 50;
            trash.health = trash.maxHealth

            trash.fallThrehold = game.rnd.integerInRange(0, 75)
            phaserGroup.add(3, trash)

            // damage it
            trash.damageIt = function(val:number){
              // let emitter = phaserMaster.get('emitter');
              //     emitter.x = this.x;
              //     emitter.y = this.y
              //     emitter.start(true, 1500, null, 5);
              this.health -= val;

              this.tint = 1 * 0xff0000;
              this.game.add.tween(this).to( {tint: 1 * 0xffffff}, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);

              if(this.health <= 0){
                this.destroyIt()
              }
              else{

              }
            }

            trash.removeIt = function(){
              phaserSprites.destroy(this.name)
            }

            trash.fallToPlanet = function(){
              this.tint = 1 * 0x000000;
              this.atTarget = true;
              this.body = null;
              this.game.add.tween(this).to( {y: this.y + 60}, Phaser.Timer.SECOND*2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
              setTimeout(() => {
                this.game.add.tween(this.scale).to( {x: 0, y: 0}, Phaser.Timer.SECOND*1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                  onComplete.add(() => {
                    this.removeIt();
                    earthTakeDamage(1);
                    createExplosion(this.x, this.y, 0.25)
                  }).autoDestroy = true;
              }, 300)
            }

            // destroy it
            trash.destroyIt = function(){
                // add to score
                let score = phaserMaster.get('score');
                phaserMaster.forceLet('score', score += 25);
                let scoreText = phaserTexts.get('scoreText')
                    scoreText.updateScore();

                // animate it
                let tween = {
                  angle: game.rnd.integerInRange(-720, 720),
                  x: this.x - game.rnd.integerInRange(-25, 25),
                  y: this.y - game.rnd.integerInRange(5, 25),
                  alpha: .5
                }
                this.game.add.tween(this).to( tween, game.rnd.integerInRange(50, 200), Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;

               // animate death and then explode
               game.time.events.add(Phaser.Timer.SECOND/3, () => {
                  createExplosion(this.x, this.y, 0.5)
                  phaserSprites.destroy(this.name);
               }, this).autoDestroy = true;
            }

            trash.checkLocation = function(){
              this.angle += trash.angleMomentum
              if(this.angleMomentum > 0){
                this.angleMomentum -= 0.002
              }
              if(this.angleMomentum < 0){
                this.angleMomentum += 0.002
              }
              if(this.y > this.height){
                if(this.body !== null){
                  this.body.collideWorldBounds = true;
                }
              }
              if(this.y > this.game.canvas.height - (50 + this.fallThrehold)){
                if(this.body !== null && !this.atTarget){
                  this.body.collideWorldBounds = false;
                  this.fallToPlanet();
                }
              }
              if(this.y > this.game.canvas.height + this.height){
                this.removeIt();
              }
            }

            trash.onUpdate = function(){
              this.rotate += 4
              if(this.body !== null){
                if(this.body.velocity.y + 1 < 50){
                  this.body.velocity.y += 1
                }
                if(this.body.velocity.x > 0){
                  this.body.velocity.x -= 0.2
                }
                if(this.body.velocity.x < 0){
                  this.body.velocity.x += 0.2
                }
              }
              this.checkLocation();
            }
      }
      /******************/

      /******************/
      function createBullet(options, isCenter = false){
        let game = phaserMaster.game();
        let bulletCount = phaserSprites.getGroup('bullets').length;
        let primaryWeapon = phaserMaster.get('primaryWeapon');
        let bullet =  phaserSprites.addFromAtlas({y: options.y, name: `bullet_${game.rnd.integer()}`, group: 'primaryWpnSprite', atlas: 'atlas_main', filename: `beam_frame_1.png`})
            bullet.angle = -90;
            bullet.x = options.x + options.offset - bullet.width/2

            game.physics.enable(bullet, Phaser.Physics.ARCADE);
            bullet.body.velocity.y = primaryWeapon.initialVelocity;
            phaserGroup.add(2, bullet)

            bullet.accelerate = function(){
              this.body.velocity.y -= primaryWeapon.velocity;
              this.body.velocity.x += options.spread
            }

            bullet.destroyIt = function(){
              if(primaryWeapon.secondaryExplosion){
                impactExplosion(this.x, this.y, .25, (primaryWeapon.damage * options.damageMod))
              }
              phaserSprites.destroy(this.name)
            }

            bullet.onUpdate = function(){
              // bullet speeds up
              this.accelerate();
              // destroy bullet
              if(this.y < 0){ this.destroyIt() }
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (bullet, target)=>{
                  if(!primaryWeapon.pierce){
                    bullet.destroyIt()
                  }
                  target.damageIt(primaryWeapon.damage * options.damageMod);
                }, null, this);
              })
           }
      }
      /******************/

      /******************/
      function createLaser(options, isCenter = false){
        let game = phaserMaster.game();
        let bulletCount = phaserSprites.getGroup('bullets').length;
        let primaryWeapon = phaserMaster.get('primaryWeapon');
        let bullet = phaserSprites.addFromAtlas({y: options.y - 70, name: `bullet_${game.rnd.integer()}`, group: 'primaryWpnSprite', atlas: 'atlas_main', filename: `beam_frame_1.png`})

            bullet.animations.add('shoot', Phaser.Animation.generateFrameNames('beam_frame_', 1, 4, '.png'), 1, true)
            bullet.animations.play('shoot', 30, true)

            bullet.scale.setTo(0.5, 0.5)
            bullet.x = options.x + options.offset - bullet.width/2

            game.physics.enable(bullet, Phaser.Physics.ARCADE);
            bullet.body.velocity.y = primaryWeapon.initialVelocity;
            phaserGroup.add(2, bullet)

            bullet.accelerate = function(){
              this.body.velocity.y -= primaryWeapon.velocity;
              this.body.velocity.x += options.spread
            }

            bullet.destroyIt = function(){
              if(primaryWeapon.secondaryExplosion){
                impactExplosion(this.x, this.y, .25, (primaryWeapon.damage * options.damageMod))
              }
              phaserSprites.destroy(this.name)
            }

            bullet.onUpdate = function(){
              // bullet speeds up
              this.accelerate();
              // destroy bullet
              if(this.y < 0){ this.destroyIt() }
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (bullet, target)=>{
                  if(!primaryWeapon.pierce){
                    bullet.destroyIt()
                  }
                  target.damageIt(primaryWeapon.damage * options.damageMod);
                }, null, this);
              })
           }
      }
      /******************/

      /******************/
      function createMissle(options, isCenter = false){
        let game = phaserMaster.game();
        let bulletCount = phaserSprites.getGroup('bullets').length;
        let primaryWeapon = phaserMaster.get('primaryWeapon');
        let bullet =  phaserSprites.addFromAtlas({y: options.y, name: `bullet_${game.rnd.integer()}`, group: 'primaryWpnSprite', atlas: 'atlas_main', filename: `missle1.png`})
            bullet.angle = -90;
            bullet.x = options.x + options.offset
            bullet.isActive = false;
            bullet.scale.setTo(0.25, 0.25)
            bullet.anchor.setTo(0.5, 0.5)
            phaserGroup.add(2, bullet)

            bullet.game.add.tween(bullet.scale).to( { x: 1, y: 1}, 150, Phaser.Easing.Linear.Out, true, 150)
              .onComplete.add(() => {
                game.physics.enable(bullet, Phaser.Physics.ARCADE);
                bullet.body.velocity.y = primaryWeapon.initialVelocity;
                bullet.isActive = true
              })


            bullet.accelerate = function(){
              this.body.velocity.y -= primaryWeapon.velocity;
              this.body.velocity.x += options.spread
            }

            bullet.destroyIt = function(){
              if(primaryWeapon.secondaryExplosion){
                impactExplosion(this.x, this.y, 1, (primaryWeapon.damage * options.damageMod))
              }
              phaserSprites.destroy(this.name)
            }

            bullet.onUpdate = function(){
              if(bullet.isActive){
                // bullet speeds up
                this.accelerate();
                // destroy bullet
                if(this.y < 0){ this.destroyIt() }
                // check for bullet collision
                returnAllCollidables().forEach((target) => {
                  target.game.physics.arcade.overlap(this, target, (bullet, target)=>{
                    if(!primaryWeapon.pierce){
                      bullet.destroyIt()
                    }
                    target.damageIt(primaryWeapon.damage * options.damageMod);
                  }, null, this);
                })
              }
           }
      }
      /******************/

      /******************/
      function createClusterbomb(options){
        let game = phaserMaster.game();
        let bombCount = phaserSprites.getGroup('bombCount').length;
        let bomb =  phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `secondary_${game.rnd.integer()}`, group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png'})
            bomb.anchor.setTo(0.5, 0.5)
            bomb.scale.setTo(1.5, 1.5);
            game.physics.enable(bomb, Phaser.Physics.ARCADE);
            bomb.body.velocity.y = options.velocity;
            phaserGroup.add(2, bomb)
            bomb.angle = 90;
            bomb.hasDetonated = false;

            setTimeout(() => {
              if(!bomb.hasDetonated){
                bomb.hasDetonated = true;
                bomb.destroyIt();
              }
            }, 800)

            bomb.destroyIt = function(){
              createExplosion(this.x, this.y, 1.25)
              for(let i = 0; i < options.bomblets; i++){
                createBomblet({
                  x: this.x,
                  y: this.y,
                  ix: game.rnd.integerInRange(-400, 400),
                  iy: game.rnd.integerInRange(-400, 100),
                  damage: options.damage/4
                })
              }
              phaserSprites.destroy(this.name)
            }


            bomb.onUpdate = function(){
              this.angle += 5;
              // bullet speeds up
              // destroy bullet
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (bomb, target)=>{
                  if(!bomb.hasDetonated){
                    bomb.hasDetonated = true;
                    bomb.destroyIt();
                  }
                  target.damageIt(options.damage);
                }, null, this);
              })

           }
      }
      /******************/

      /******************/
      function createTriplebomb(options){
        let game = phaserMaster.game();
        let bomb =  phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `secondary_${game.rnd.integer()}`, group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png'})
            bomb.anchor.setTo(0.5, 0.5)
            game.physics.enable(bomb, Phaser.Physics.ARCADE);
            bomb.body.velocity.y = options.initialVelocity;
            phaserGroup.add(2, bomb)

            bomb.accelerate = function(){
              this.body.velocity.y -= (options.velocity * options.delay)
            }

            bomb.destroyIt = function(){
              impactExplosion(this.x, this.y, 2.5, options.damage)
              phaserSprites.destroy(this.name)
            }


            bomb.onUpdate = function(){
              this.accelerate();
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (bomb, target)=>{
                  bomb.destroyIt();
                  target.damageIt(options.damage);
                }, null, this);
              })

           }
      }
      /******************/

      /******************/
      function createTurret(options){
        let game = phaserMaster.game();
        let turret =  phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `secondary_${game.rnd.integer()}`, group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png'})
            game.physics.enable(turret, Phaser.Physics.ARCADE);
            phaserGroup.add(2, turret)
            setTimeout(() => {
              turret.destroyIt();
            }, options.lifespan)


            turret.fireInterval = setInterval(() => {
              let {x, y, width} = turret;
              createBullet({x: x + width/2, offset: 0, y: y, spread: 0, damageMod: 1})
              createBullet({x: x + width/2 + 20, offset: 0, y: y, spread: 0, damageMod: 1})
              createBullet({x: x + width/2 - 20, offset: 0, y: y, spread: 0, damageMod: 1})
            }, 200)
            turret.fireInterval;

            turret.destroyIt = function(){
              impactExplosion(this.x, this.y, 2.5, options.damage)
              clearInterval(this.fireInterval)
              phaserSprites.destroy(this.name)
            }


            turret.onUpdate = function(){
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (turret, target)=>{
                  turret.destroyIt();
                  target.damageIt(options.damage);
                }, null, this);
              })
           }
      }
      /******************/

      /******************/
      function createMine(options){
        let game = phaserMaster.game();
        let mine =  phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `secondary_${game.rnd.integer()}`, group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png'})
            mine.anchor.setTo(0.5, 0.5)
            mine.scale.setTo(1.5, 1.5);
            game.physics.enable(mine, Phaser.Physics.ARCADE);
            phaserGroup.add(2, mine)

            if(phaserSprites.getGroup('secondaryWpnSprite').length > options.limit){
              phaserSprites.getGroup('secondaryWpnSprite')[0].destroyIt();
            }

            mine.destroyIt = function(){
              let {x, y} = this
              impactExplosion(x, y, 3, options.damage)
              setTimeout(() => {
                impactExplosion(x, y, 2, options.damage)
              }, 500)
              clearInterval(this.fireInterval)
              phaserSprites.destroy(this.name)
            }

            mine.onUpdate = function(){
              this.angle += 5;
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (mine, target)=>{
                  mine.destroyIt();
                  target.damageIt(options.damage);
                }, null, this);
              })
           }
      }
      /******************/

      /******************/
      function createBomblet(options:any){
        let game = phaserMaster.game();
        let bombCount = phaserSprites.getGroup('bombCount').length;
        let bomblet =  phaserSprites.addFromAtlas({x: options.x, y: options.y, name: `bomblet_${game.rnd.integer()}`, group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png'})
            bomblet.anchor.setTo(0.5, 0.5)
            bomblet.scale.setTo(0.5, 0.5)
            game.physics.enable(bomblet, Phaser.Physics.ARCADE);
            bomblet.body.velocity.y = options.iy
            bomblet.body.velocity.x = options.ix
            bomblet.fuse = game.time.now;
            bomblet.detonate = game.time.now + game.rnd.integerInRange(1250, 1800)
            phaserGroup.add(2, bomblet)

            bomblet.destroyIt = function(){
              impactExplosion(this.x, this.y, 1, options.damage)
              phaserSprites.destroy(this.name)
            }


            bomblet.onUpdate = function(){
              this.angle += 10;
              // detonate after 500 miliseconds
              if(this.game.time.now > bomblet.detonate){
                this.destroyIt();
              }
              // watch for collisions
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (bomb, target)=>{
                  bomblet.destroyIt();
                  target.damageIt(options.damage);
                }, null, this);
              })

           }
      }
      /******************/

      /******************/
      function createExplosion(x, y, scale){
        let game = phaserMaster.game();
        let explosion = phaserSprites.addFromAtlas({name: `explosion_${game.rnd.integer()}`, group: 'explosions',  x: x, y: y, atlas: 'atlas_main', filename: `explosions_Layer_1.png`})
            explosion.scale.setTo(scale, scale)
            explosion.anchor.setTo(0.5, 0.5)
            explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true)
            explosion.animations.play('explosion', 30, true)
            phaserGroup.add(6, explosion)
            // destroy expolosion sprite
            setTimeout(() => {
              phaserSprites.destroy(explosion.name)
            }, Phaser.Timer.SECOND/2)
      }
      /******************/

      /******************/
      function impactExplosion(x, y, scale, damage){
        let game = phaserMaster.game();
        let impactExplosion = phaserSprites.addFromAtlas({name: `impactExplosion_${game.rnd.integer()}`, group: 'impactExplosions',  x: x, y: y, atlas: 'atlas_main', filename: `explosions_Layer_1.png`})
            impactExplosion.scale.setTo(scale, scale)
            impactExplosion.anchor.setTo(0.5, 0.5)
            impactExplosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true)
            impactExplosion.animations.play('explosion', 30, true)
            game.physics.enable(impactExplosion, Phaser.Physics.ARCADE);
            phaserGroup.add(6, impactExplosion)
            // destroy expolosion sprite
            game.time.events.add(Phaser.Timer.SECOND/2, () => {
              phaserSprites.destroy(impactExplosion.name)
            }).autoDestroy = true;

            impactExplosion.onUpdate = function(){
              // check for bullet collision
              returnAllCollidables().forEach((target) => {
                target.game.physics.arcade.overlap(this, target, (impactExplosion, target)=>{
                  target.damageIt(25);
                }, null, this);
              })

           }
      }
      /******************/

      /******************/
      function returnAllCollidables(){
        return [...phaserSprites.getGroup('aliens'),   ...phaserSprites.getGroup('trashes'), ...phaserSprites.getGroup('boss')]
      }
      /******************/

      /******************/
      function pauseGame(){
        phaserMaster.get('clock').stop();
      }
      /******************/

      /******************/
      function unpauseGame(){
        phaserMaster.get('clock').start();
      }
      /******************/

      /******************/
      function update() {
        let game = phaserMaster.game();
        // let filter = phaserMaster.get('filter');
        //     filter.update();
        let starMomentum = phaserMaster.get('starMomentum');
        let player = phaserSprites.get('player')
        let specialWeapon = phaserSprites.get('specialWeapon')
        let primaryWeapon = phaserMaster.get('primaryWeapon')
        let secondaryWeapon = phaserMaster.get('secondaryWeapon')
        let elapsedTime = parseInt(phaserMaster.get('elapsedTime').toFixed(0));

        phaserSprites.getGroup('spaceGroup').forEach(obj => {
          obj.onUpdate();
        })
        phaserSprites.getGroup('movingStarField').forEach(obj => {
          obj.onUpdate();
        })
        phaserSprites.getGroup('primaryWpnSprite').forEach(obj => {
          obj.onUpdate()
        })
        phaserSprites.getGroup('secondaryWpnSprite').forEach(obj => {
          obj.onUpdate()
        })
        phaserSprites.getGroup('impactExplosions').forEach(obj => {
          obj.onUpdate()
        })
        phaserSprites.getGroup('playership').forEach((obj) => {
          obj.onUpdate()
        })

        if(phaserMaster.checkState('READY')){



          // update objects
          phaserTexts.getGroup('ui').forEach((text) => {
            text.onUpdate();
          })

          // check alient behavior
          phaserSprites.getGroup('ui_overlay').forEach((obj) => {
            obj.onUpdate()
          })


          if(phaserTexts.get('timeKeeper') !== undefined){
            phaserTexts.get('timeKeeper').onUpdate();
          }

          // check alient behavior
          phaserSprites.getGroup('aliens').forEach((obj) => {
            obj.onUpdate()
          })

          phaserSprites.getGroup('boss').forEach((obj) => {
            obj.onUpdate()
          })

          // check alient behavior
          phaserSprites.getGroup('trashes').forEach((obj) => {
            obj.onUpdate()
          })

          // create a steady steam of aliens to shoot
          if(elapsedTime < 15 && phaserSprites.getGroup('aliens').length < 5){
            createAlien({
              x: game.rnd.integerInRange(0, game.canvas.width),
              y: game.rnd.integerInRange(-50, -100),
              ix: game.rnd.integerInRange(-100, 100),
              iy: game.rnd.integerInRange(0, 150)
            });
          }

          if(elapsedTime === 15 && phaserSprites.getGroup('boss').length === 0){
            createBoss({
              x: game.rnd.integerInRange(100, game.canvas.width - 100),
              y: game.rnd.integerInRange(-50, -100),
              ix: game.rnd.integerInRange(-100, 100),
              iy: 5
            });
          }

          // player controls
          if(phaserControls.read('RIGHT').active){
            starMomentum.x = -2
            player.moveX(5)
          }

          if(phaserControls.read('LEFT').active){
            starMomentum.x = 2
            player.moveX(-5)
          }


          if(phaserControls.read('UP').active){
            starMomentum.y = 5
            player.moveY(-5)
          }
          if(phaserControls.read('DOWN').active){
            starMomentum.y = -2
            player.moveY(5)
          }


          if(phaserControls.checkWithDelay({isActive: true, key: 'A', delay: primaryWeapon.cooldown - (phaserControls.read('A').state * primaryWeapon.rapidFireSpd) })){

            if(primaryWeapon.wpnType === 'LASER'){
              createLaser({x: player.x, offset:-15, y: player.y, spread: -primaryWeapon.spread/2, damageMod: 1})
              createLaser({x: player.x, offset:15, y: player.y, spread: primaryWeapon.spread/2, damageMod: 1})
              createLaser({x: player.x, offset:-50, y: player.y + 20, spread: -primaryWeapon.spread, damageMod: 1})
              createLaser({x: player.x, offset:50, y: player.y + 20, spread: primaryWeapon.spread, damageMod: 1})
            }

            if(primaryWeapon.wpnType === 'MISSLES'){
              createMissle({x: player.x, offset: 0, y: player.y, spread: 0, damageMod: 1})
              createMissle({x: player.x, offset:-30, y: player.y - 10, spread: -primaryWeapon.spread/2, damageMod: 1})
              createMissle({x: player.x, offset:30, y: player.y - 10, spread: primaryWeapon.spread/2, damageMod: 1})
            }

            if(primaryWeapon.wpnType === 'BULLET'){
              createBullet({x: player.x, offset:-15, y: player.y, spread: -primaryWeapon.spread/2, damageMod: 1})
              createBullet({x: player.x, offset:15, y: player.y, spread: primaryWeapon.spread/2, damageMod: 1})
              createBullet({x: player.x, offset:-40, y: player.y + 10, spread: -primaryWeapon.spread, damageMod: 1})
              createBullet({x: player.x, offset:40, y: player.y + 10, spread: primaryWeapon.spread, damageMod: 1})
              createBullet({x: player.x, offset:-60, y: player.y + 20, spread: -primaryWeapon.spread, damageMod: 1})
              createBullet({x: player.x, offset:60, y: player.y + 20, spread: primaryWeapon.spread, damageMod: 1})
            }

          }

          if(phaserControls.checkWithDelay( {isActive: true, key: 'B', delay: secondaryWeapon.cooldown} )){
            if(specialWeapon !== undefined){
              specialWeapon.onPress(secondaryWeapon.cooldown)
              // reset speciaal timer and start charge animation
              updateShipSpecial(0, true)
              game.time.events.add(50, () => {
                updateShipSpecial(100, false, secondaryWeapon.cooldown-50)
              }).autoDestroy = true;
            }

            if(secondaryWeapon.wpnType === 'CLUSTERBOMB'){
              let {x, y} = player
              createClusterbomb({x: x, y: y, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, bomblets: secondaryWeapon.bomblets})
            }

            if(secondaryWeapon.wpnType === 'TRIPLEBOMB'){
              let {x, y} = player
              createTriplebomb({x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 1})
              createTriplebomb({x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 2})
              createTriplebomb({x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 3})
            }

            if(secondaryWeapon.wpnType === 'TURRET'){
              let {x, y} = player
              createTurret({x: x, y: y, damage: secondaryWeapon.damage, lifespan: secondaryWeapon.lifespan})
            }

            if(secondaryWeapon.wpnType === 'MINES'){
              let {x, y} = player
              createMine({x: x, y: y, damage: secondaryWeapon.damage, limit: secondaryWeapon.limit})
            }

          }
        }


        if(phaserMaster.checkState('ENDLEVEL')){
            player.onUpdate()
        }
      }
      /******************/

      /******************/
      function endLevel(){
        let game = phaserMaster.game();
        let gameData = phaserMaster.get('gameData');
        phaserMaster.changeState('ENDLEVEL');

        // hide UI text
        phaserTexts.getGroup('ui_text').forEach(text => {
          text.hide();
        })

        phaserSprites.getGroup('ui').forEach(obj => {
          obj.hide();
        })
        phaserSprites.getGroup('secondaryWpnSprite').forEach(obj => {
          obj.destroyIt()
        })

        // initiate player end sequence
        phaserSprites.get('player').playEndSequence(() => {
          // update level and save data
          let level = gameData.level++;
              level++;
          saveData('level', level)

          let score = phaserMaster.get('score');
          saveData('score', score)

          let population = phaserMaster.get('population')
          saveData('population', {total: population.total, killed: population.killed})

          for(var i = 0; i < 20; i++){
            setTimeout(() => {
              createExplosion(game.rnd.integerInRange(0, game.world.width), game.rnd.integerInRange(0, game.world.height), game.rnd.integerInRange(1, 4))
            }, game.rnd.integerInRange(0, 50)*i)
          }

          setTimeout(() => {
            // destroy all aliens
            phaserSprites.getGroup('aliens').forEach((alien) => {
              setTimeout(() => {
                  alien.destroyIt(false)
              }, game.rnd.integerInRange(0, 500))
            })

            // destroy all trash
            phaserSprites.getGroup('trashes').forEach((trash) => {
              setTimeout(() => {
                trash.destroyIt(false)
              }, game.rnd.integerInRange(0, 500))
            })


            setTimeout(() => {
              playSequence('NICE JOB STUD', ()=>{

                // destroy all aliens
                phaserSprites.getGroup('movingStarField').forEach((star) => {
                  star.fadeOut()
                })

                // destroy all aliens
                phaserSprites.get('earth').fadeOut()

                setTimeout(() => {
                  let pop = phaserMaster.get('population')
                  let leftText = phaserTexts.add({name: 'popLeft',  font: 'gem', y: game.world.centerY,  size: 58, default: `Humans saved:`, visible: true})
                  phaserTexts.alignToCenter('popLeft')
                  leftText.game.add.tween(leftText).to( { alpha: 0}, 1000, Phaser.Easing.Linear.Out, true, Phaser.Timer.SECOND)
                    .onComplete.add(() => {
                      leftText.alpha = 1
                      leftText.setText(`${(pop.total - pop.killed)* 700000}`)
                      phaserTexts.alignToCenter('popLeft')
                      leftText.game.add.tween(leftText).to( { alpha: 0}, 1000, Phaser.Easing.Linear.Out, true, Phaser.Timer.SECOND*2)
                        .onComplete.add(() => {
                          phaserSprites.get('overlay').fadeIn(Phaser.Timer.SECOND*1.5, () => {
                            endGame();
                          })
                        })
                    })
                }, Phaser.Timer.SECOND)


              })
            },Phaser.Timer.SECOND*1.5)

          }, Phaser.Timer.SECOND/3)

        });
      }

      function gameOver(){
        phaserMaster.changeState('GAMEOVER');
        let player = phaserSprites.get('player')
        let earth = phaserSprites.get('earth')

        player.selfDestruct()
        earth.selfDestruct()

        playSequence('DUDE IT WAS THE FIRST LEVEL JEEZE', ()=>{
          setTimeout(() => {
            phaserSprites.get('overlay').fadeIn(Phaser.Timer.SECOND*3, () => {
              parent.gameOver();
            })
          }, Phaser.Timer.SECOND*1.5)
        })
      }

      function endGame(){
        parent.loadShop()
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
