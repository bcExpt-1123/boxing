import { useState, useEffect } from 'react'
import Functions from '../Helpers/Functions'
import Navbar from '../Interface/Navbar/Navbar'
import BoxerCard from '../Boxer/BoxerCard/BoxerCard'
import Display from '../Interface/Display/Display'
import leftBoxer from '../../assets/images/redgloves.png'
import oppBody from '../../assets/images/oppBody.png'
import SelectMenu from '../Interface/SelectMenu/SelectMenu'
// import randomize from '../Helpers/Randomize'

const FightEngine = ({ user, enemy }) => {
  
  const { setObj, setCorner } = Functions(); //unpack functions from Helpers/Functions

  /*** general state ***/
  const [userActive, setUserActive] = useState(user); //point to an updated state of user attributes
  const [oppActive, setOppActive] = useState(enemy);
  const [userDmgScale, setUserDmgScale] = useState(); //store values for each total damage output for data
  const [oppDmgScale, setOppDmgScale] = useState();
  const [pbp, setPbp] = useState([]); //a combination of above state in objects, for historical fight record
  const [punchCount, setPunchCount] = useState([]); //data for each punch/counter punch thrown, for historical fight record
  const [rateOfExchange] = useState(10);  //toggle number of punches in one round based on boxer handSpeed
  const [exchangeCount, setExchangeCount] = useState(0);  //count number of times boxers enter a scrap
  const [delay] = useState(1000);  //toggle rate of text ouput

  /***  match specific state ***/
  const [ko, setKo] = useState(false);
  const [disable, setDisable] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [roundStart, setRoundStart] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const [fightStart, setFightStart] = useState(false);
  const [fightOver, setFightOver] = useState(false);
  const [totalRingControl, setTotalRingControl] = useState([]);
  const [totalAccuracy, setTotalAccuracy] = useState([]);
  const [finalTotals, setFinalTotals] = useState([]); //data for UI stat output
  const [judgeOne, setJudgeOne] = useState([]);


  useEffect(() => { //shallow copy of user/enemy for manipulation
    setUserActive(userReady);
    setOppActive(oppReady);
  },[])

  useEffect(() => { //check start/stop conditions
    if (user.knockdownCount === 3 || enemy.knockdownCount === 3) {
      setKo(true)
      setFightOver(true);
    }
    if (roundStart || ko || fightOver ) setDisable(true);
    if (ko) {
      setFightOver(true);
    }
  },[roundStart, ko, fightOver, user.knockdownCount, enemy.knockdownCount])

  useEffect(() => {
    if (roundCount === 2 && roundOver) {
      setDisable(true);
      setFightOver(true);
    }
  },[roundOver, roundCount])

  useEffect(() => { //toggle specific end-of-round (roundOver) and round start attributes
    if (roundStart || fightOver) {
      user.knockdownCount = 0;
      enemy.knockdownCount = 0;
    }
  }, [roundStart])

  useEffect(() => {
    if (roundCount > 0 && roundOver) {
      console.log("judging")
      judgeOneDecision(user, enemy, 'control');
    } 
  }, [roundOver, roundCount])

  useEffect(() => { 
    if(fightOver) checkWinnerAndLoser(user, enemy);
  },[fightOver])


  //HERE is where you set the fighters extra stats, randomize cornerColors in future, change before each new fight!
  const cornerColor = { red: `rgba(139, 0, 0, 1)`, blue: `rgba(10, 30, 103, 1)` }
  const userReady = setCorner(user, cornerColor.red, "red", "left", false, userDmgScale)
  const oppReady = setCorner(enemy, cornerColor.blue, "blue", "right", true, oppDmgScale)

  const filterStats = (person, whatToFilter) => {
    for (let i = 0; i < finalTotals.length; i++){
      if(finalTotals[i].hasOwnProperty(person.firstName)){
        return finalTotals[i][person.firstName][whatToFilter]
      }
    }
  };

  console.log(roundStart, roundOver, judgeOne)
  console.log(`user record`, user.win, user.loss);
  console.log(`opp record`, enemy.win, enemy.loss);

  /*** Build logic for Judge criteria ***/ //REFACTOR
  const judgeOneDecision = (user, enemy, whatToJudge) => {
    const judgeUser = filterStats(user, whatToJudge);
    const judgeOpp = filterStats(enemy, whatToJudge);
    let userScore = 9;
    let oppScore = 9;

    if (enemy.knockdownCount === user.knockdownCount) {

      if (judgeUser > judgeOpp){
        userScore = 9;
        oppScore = 10;
        setJudgeOne(prev => [...prev, [userScore, oppScore]]);
      } else if (judgeOpp > judgeUser) {
        oppScore = 9;
        userScore = 10;
        setJudgeOne(prev => [...prev, [userScore, oppScore]]);
      }
    } else {

    if (user.knockdownCount > 0) {
      userScore -= user.knockdownCount;
      oppScore++;
      setJudgeOne(prev => [...prev, [userScore, oppScore]]);
    }
    if (enemy.knockdownCount > 0) {
      oppScore -= enemy.knockdownCount;
      userScore++;
      setJudgeOne(prev => [...prev, [userScore, oppScore]]);
    }
    
    if (user.knockdownCount > 0 && enemy.knockdownCount > 0) {
        if (user.knockdownCount > enemy.knockdownCount) {
          userScore = 9;
          oppScore = 10;
          setJudgeOne(prev => [...prev, [userScore, oppScore]]);

        } else if (enemy.knockdownCount > user.knockdownCount) {
          oppScore = 9;
          userScore = 10;
          setJudgeOne(prev => [...prev, [userScore, oppScore]]);
        }
      }
    }
  }

  /*** Adjust win or loss  ***/
  const checkWinnerAndLoser = (user, opp) => {
    if (fightOver) {
      if (user.hp <= 0) {
        user.loss++;
        opp.win++;
      } else if (opp.hp <= 0) {
        opp.win++;
        user.win++;
      } else {

        //improve judging logic! ****
        const judgeOneUserScore = judgeOne.reduce((acc, curr, i) => acc += curr[0]);
        console.log(judgeOneUserScore)
      }
      console.log(`FIGHT OVER`);
    }
  }

  const determineKO = (offense, defense, hit, timeout ) => {

    /*** Initialize getUp abilites, update UI ***/
    if (defense.hp <= 0) {
      console.log("DETERMINING KO")
      const getUpTimer = setTimeout(() => { //slow down getUp post knock out text boxes.
        const takesShot = defense.getUp();
        const getUp = defense.getUp();
        setPbp(prev => [...prev, {  //push to play-by-play array with new object.
          attacker: offense,
          defender: defense,
          hit: hit,
          text: `${defense.firstName} down with the count!`}
        ])
        defense.knockdownCount++;

        /*** Check getUp, if greater than first "will" to get up, boxer gets up  ***/
        if (getUp > takesShot) {
          setKo(false)          
          setPbp(prev => [...prev, {
            attacker: offense,
            defender:defense,
            hit: hit,
            text: `${defense.firstName} stands back up!`
          }])
          defense.hp*=1.2;
          return determineKO;
          
        } else {  //fight is over, clear timeout, set the play-by-play to notify user and return
          setFightOver(true); 
          clearTimeout(timeout)
          setPbp(prev => [prev, {
            attacker: offense,
            defender: defense,
            hit: hit,
            text: `THIS FIGHT IS OVER. The ref waves it off! ${offense.firstName} PUTS ${defense.firstName} AWAY.`
          }])
          return determineKO;
        }
      }, 600);
      clearTimeout(getUpTimer)
    }
  };


  const determinePowerShot = (off, def, diff) => {
    let powerShot = off.ko(def); //determine powershot, then if KO
    if (powerShot > def.chin){  //check if powershot is stronger than chin
      setPbp(prev => [...prev, {
        attacker: off,
        defender: def,
        hit: diff,
        text: `A BIG SHOT BY ${off.firstName}. ${def.firstName} stumbles!`
      }])

    const consciousness = def.getUp();
    if (consciousness < powerShot){  //check if powershot is stronger than def ability to getUp (take a shot)
      setKo(true);
      def.knockdownCount++;
      setPbp(prev => [...prev, {
        attacker: off,
        defender: def,
        hit: diff,
        text: `${def.firstName} IS DOWN. DOES HE GET BACK UP?`
      }])
      def.energyLoss();
      determineKO(off, def, powerShot) //Post determine KO is where you setKo to false, and implement ref count
      setKo(false) //if determineKO does not persist ko state, (setKo(false)), then continue pbp.
      setPbp(prev => [...prev, {
        attacker: off,
        defender: def,
        hit: diff,
        text: `${def.firstName} beats the count!`
      }])
      }
      return powerShot + diff //if not return a heavier shot
    } else {
      return diff
    }
  }
  
   //Phase 1 = exchange() determines who wins the trading of blows
  const exchange = (attacker, defender) => {
    let atkCombos = attacker.handSpeed(); //determine punch volume
    let defCombos = defender.handSpeed();
    let atk = attacker.attack(atkCombos);
    let def = defender.defend(defCombos);
    let difference = atk - def;

    //activity of fighters changes length of loop, makes it more or less active
    let attackerPunchesLanded = Math.round(((atk*(atkCombos/100))/rateOfExchange)*attacker.maxCon);
    let defenderPunchesLanded = Math.round(((def*(defCombos/100))/rateOfExchange)*defender.maxCon);

    setPunchCount(prev => [...prev, {  //set punchCount list, to store punchStats
      attacker: {
        name: attacker.firstName,
        punchesThrown: Math.ceil((atkCombos/rateOfExchange)), //round up a randomized no. of punches in combo
        punchesLanded: attackerPunchesLanded, //round 
        engagementRate: atk/10,
        ringControl: Math.round((atk/(atk+def))*100),
        engagement: `aggressor`
      },
      defender: {
        name: defender.firstName,
        punchesThrown: Math.ceil((defCombos/rateOfExchange)),
        punchesLanded: defenderPunchesLanded,
        engagementRate: def/10,
        ringControl: Math.round((def/(def+atk))*100),
        engagement: `counter`
      },
      difference: difference,
      round: roundCount+1
    }])
    return difference
  };


 //Phase 2 = wrap both attack and defense with output text in one single obj, easier to package for output
  const calcDamage = (attacker, defender, difference, timeout) => {

      let result = { //an object template to populate the pbp
        attacker: attacker,
        defender: defender,
        totalDmg: 0,
        text: 'The fighters clinch'
      };
      let hit;
      let normalOrPowerPunch;

    /***
    FIGHT COMMENTARY GOES HERE: refactor all conditional events!
    ***/

    /*** Fight balance favors defender ***/

    if (difference <= -35){ //Strong counters by defender
      hit = attacker.hp += difference; //reduce health
      setObj(attacker, "hp", hit);
      result.totalDmg = difference
      result.text = `${defender.firstName} returning some BIG, HEAVY counters!`;

    } else if (difference > -35 && difference <= -25){ //Close Counter in favor of defender.
      hit = attacker.hp += difference; //reduce health
      setObj(attacker, "hp", hit);
      result.totalDmg = difference;
      result.text = `${defender.firstName} keeping the pressure off and working well on the outside.`;

    } else if (difference > -25 && difference <= -15){ //Close Counter in favor of defender.
      hit = attacker.hp += difference; //reduce health
      setObj(attacker, "hp", hit);
      result.totalDmg = difference;
      result.text = `${defender.firstName} making ${attacker.firstName} pay on the way in`;

    } else if (difference > -15 && difference < -5){ //Close Counter in favor of defender.
      hit = attacker.hp += difference; //reduce health
      setObj(attacker, "hp", hit);
      result.totalDmg = difference;
      result.text = `${defender.firstName} moving well to avoid ${attacker.firstName}'s offense. Peppering jabs in response.`;

    /***  Fight balance is close  ***/

    } else if (difference >=5 && difference <-2) { //Inside work for defender
      hit = attacker.hp -= 2;
      defender.hp -= 1;
      setObj(defender, "hp", hit);
      result.totalDmg = 2;
      result.text = `Both fighters work inside...${defender.firstName} getting the best of the scrap.`;

    } else if (difference >= 2 && difference <= 2) {
      hit = attacker.hp -= 0;
      attacker.roundRecovery();
      defender.roundRecovery();
      setObj(attacker, "hp", hit);
      result.totalDmg = 0;
      result.text = `Both fighters work in the clinch...Ref decides to break.`;

    // } else if (difference === 1){
    //   hit = defender.hp -= 2;
    //   attacker.hp -= 1;
    //   setObj(defender, "hp", hit);

    //   result.totalDmg = 2;
    //   result.text = `Strong corner bullying by ${attacker.firstName}`;

    } else if (difference > 2 && difference <= 5) { // Close in favor of Attacker
      normalOrPowerPunch = determinePowerShot(attacker, defender, difference)
      hit = defender.hp -= normalOrPowerPunch;
      setObj(defender, "hp", hit)
      result.totalDmg = normalOrPowerPunch;
      result.text = `Solid work and steady shots by ${attacker.firstName}`;

    /***  Fight balance favors attacker  ***/

    } else if (difference > 5 && difference <= 15) {
      normalOrPowerPunch = determinePowerShot(attacker, defender, difference)
      hit = defender.hp -= normalOrPowerPunch;
      setObj(defender, "hp", hit)
      result.totalDmg = normalOrPowerPunch;
      result.text = `${attacker.firstName} working great in the mid-range!`;

    } else if (difference > 15 && difference <= 25) {
      normalOrPowerPunch = determinePowerShot(attacker, defender, difference)
      hit = defender.hp -= normalOrPowerPunch;
      setObj(defender, "hp", hit)
      result.totalDmg = normalOrPowerPunch;
      result.text = `A clinical performance by ${attacker.firstName}!`;

    } else if (difference > 25) {
      normalOrPowerPunch = determinePowerShot(attacker, defender, difference)
      hit = defender.hp -= normalOrPowerPunch;
      setObj(defender, "hp", hit)
      result.totalDmg = normalOrPowerPunch;
      result.text = `${attacker.firstName} laying some hard, clean shots with ${defender.firstName} trapped in the corner!`;
    }
    return result
  };


  //Phase 3: tie everything together
  const engagement = (user, opp, timeout) => {  //engagement determines who initiates the attack   
    let userOffense = user.engage();
    let oppOffense = opp.engage();
    let resultDmg;

    if (userOffense > oppOffense) {
      let userDmg = exchange(user, opp);
      resultDmg = calcDamage(user, opp, userDmg, timeout); //determines resulting dmg after engage and exchange
      determineKO(user, opp, userDmg, timeout);
      setUserDmgScale(userDmg);

    } else if (oppOffense > userOffense) {
      let oppDmg = exchange(opp, user);
      resultDmg = calcDamage(opp, user, oppDmg, timeout); //determines resulting dmg after engage and exchange
      determineKO(opp, user, oppDmg, timeout);
      setOppDmgScale(oppDmg);

    } else if (oppOffense === userOffense) {
      resultDmg = 0;
    }
    return resultDmg;
  };


  const fight = (user, enemy) => {
    roundUpdate();

    for (let i = 0; i < rateOfExchange; i++){ //set i length to user+opp engage for volume of strikes
      let k = i; //copy of i, to attach to delay (timeout length)
      let newRnd = roundCount + 1; //update rounds on start
      setRoundCount(newRnd);

      let fightAction = setTimeout(()=>{
        let activity;
        let over; //placeholder for various text

        /*** Replace with determineKO later, when various commentary is added  ***/
        if (user.hp <= 0) { //check for knockout
          console.log("USE FIGHT ACTION KO SEQUENCE");
          setKo(true);
          user.knockdownCount++;
          setFightOver(true);
          over = `${user.firstName} hits the canvas!! This fight is over!`;
          setPbp(prev => [...prev, {text: over, round: newRnd, attacker: enemy, defender: user} ] )
          clearTimeout(fightAction);
          return;

        } else if (enemy.hp <= 0) {
          setKo(true);
          enemy.knockdownCount++;
          setFightOver(true);
          over = `${enemy.firstName} is down in round ${newRnd}!! This fight is over!`;
          setPbp(prev => [...prev, {text: over, round: newRnd, attacker: user, defender: enemy} ] )
          clearTimeout(fightAction);
          return;
        }
        
        /***  FIGHT WORKFLOW ***/
        let fightUnderway = engagement(user, enemy, fightAction); //takes fightAction and passes it in closure like props
        setKo(false)
        setExchangeCount(k);
        activity = setObj(fightUnderway, "round", newRnd);
        setPbp((prev) => [...prev, activity]);
      }, delay*(k + 1),)
      
      /*** Delay between round options according to  ***/
      setTimeout(() => {
        setRoundStart(false);
        setRoundOver(true);
        if (!fightOver) setDisable(false);
      }, (delay*rateOfExchange)+500)
    };
 } 

 const roundUpdate = () => { //round text updates
    let update;
    if (roundCount === 0) {
      update = `This fight is officially underway!`;
      setPbp((prev) => [ ...prev, {
        text: update
      },]);
    } else if (roundStart && roundCount > 0) {
      setRoundStart(true);
      update = `The bell sounds for round ${roundCount}!`;
      setPbp((prev) => [
        {text: update},
        ...prev]);
    } 
    return update;
 }

  const fightBtn = //The main button
    <button className="fight-button" disabled={disable}
      onClick={()=> {
        setFightStart(true);
        setDisable(true);
        setRoundStart(true);
        setRoundOver(false);
        fight(user, enemy);
        user.roundRecovery();
        enemy.roundRecovery();
    }}><h4>Fight</h4></button>

  /***  rafce return jsx  ***/
  return (
    <div className="fight-engine-wrap">

      <Navbar roundCount={roundCount} judgeOne={judgeOne}/>

      <div className="main-container-wrap">
        <div className="main-container">
          <BoxerCard boxer={user} path={leftBoxer}
            pbp={pbp}
            roundStart={roundStart}
            roundCount={roundCount}
            roundOver={roundOver}
            fightOver={fightOver}
            exchangeCount={exchangeCount}
            punchCount={punchCount}
            setTotalRingControl={setTotalRingControl}
            setTotalAccuracy={setTotalAccuracy}
            finalTotals={finalTotals}
            setFinalTotals={setFinalTotals}
            corner={() => userReady}/>

          <div className="inner-container">
            <Display pbp={pbp} user={userActive} opp={oppActive}
              fightStart={fightStart}
              roundStart={roundStart}
              roundOver={roundOver}
              roundCount={roundCount}
              fightOver={fightOver}
              ko={ko}
              buttons={fightBtn}/>
            
            <div className="display-options">
              <SelectMenu buttons={fightBtn}
              fightStart={fightStart}
              roundStart={roundStart} 
              ko={ko} />
            </div>
          </div>

          <BoxerCard boxer={enemy} path={oppBody}
            pbp={pbp}
            roundStart={roundStart}
            roundCount={roundCount}
            roundOver={roundOver}
            fightOver={fightOver}
            exchangeCount={exchangeCount}
            punchCount={punchCount}
            setTotalRingControl={setTotalRingControl}
            setTotalAccuracy={setTotalAccuracy}
            finalTotals={finalTotals}
            setFinalTotals={setFinalTotals}
            corner={() => oppReady}/>
        </div>
      </div>
    </div>
  )
}

export default FightEngine