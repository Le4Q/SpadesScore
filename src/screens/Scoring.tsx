import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, AsyncStorage } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { ScreenNameList } from '../constants/ParamList';
import { PlayerCard } from '../components/PlayerCard';
import colors from '../constants/Colors';
import GameData from '../stateContainers/GameData';
import AlertModal from '../components/AlertModal';

const window = Dimensions.get('window');
const ERROR_MESSAGES = {
  unfinishedError: 'Fill in all bids and tricks before finishing the round.',
  tricksError: 'Tricks have to add up to 13.',
};

const Scoring: React.FC = (props) => {
  const [dimensions, setDimensions] = useState({
    height: window.height,
    width: window.width,
  });

  const [bids, setBids] = useState<string[]>(['-', '-', '-', '-']);
  const [tricks, setTricks] = useState<string[]>(['-', '-', '-', '-']);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalText, setModalText] = useState<string>(null);

  const gameData = GameData.useContainer();

  const navigation: StackNavigationProp<
    ScreenNameList,
    'Scoring'
  > = useNavigation();

  navigation.setOptions({
    headerRight: () => (
      <View style={{ flexDirection: 'row' }}>
        <Icon
          name='table'
          type='antdesign'
          size={30}
          color='white'
          onPress={() => navigation.navigate('ScoreBoard')}
          containerStyle={{ marginRight: 15 }}
          underlayColor={'rgba(255, 255, 255, 0.2)'}
        />
        <Icon
          name='settings'
          type='feather'
          size={30}
          color='white'
          onPress={() => navigation.navigate('Settings')}
          containerStyle={{ marginRight: 10, borderRadius: 30 }}
          underlayColor={'rgba(255, 255, 255, 0.2)'}
        />
      </View>
    ),
  });

  // adjust Dimensions on change (e.g. rotate)
  const onChange = ({ window, screen }) => {
    setDimensions({ height: window.height, width: window.width });
  };

  useEffect(() => {
    Dimensions.addEventListener('change', onChange);
    return () => {
      Dimensions.removeEventListener('change', onChange);
    };
  });

  // get team from index
  const team = (i) => {
    if (i === 0 || i === 3) return 0;
    else if (i === 1 || i === 2) return 1;
    else return -1;
  };

  // is called when hitting the finish round button. Calculates new points
  const finishRound = async () => {
    // points and bags from this round
    let newPoints = [0, 0];
    let newBags = [0, 0];

    let iBids = bids.map((x) => parseInt(x));
    let iTricks = tricks.map((x) => parseInt(x));

    if (bids.includes('-') || tricks.includes('-')) {
      setModalText(ERROR_MESSAGES.unfinishedError);
      setModalVisible(true);
      return;
    }

    if (iTricks.reduce((x, y) => x + y) !== 13) {
      setModalText(ERROR_MESSAGES.tricksError);
      setModalVisible(true);
      return;
    }

    // double zero and zero games

    for (let i = 0; i < 4; i++) {
      if (bids[i] === '00' && iTricks[i] === 0) {
        newPoints[team(i)] += 200;
      }
      if (bids[i] === '00' && iTricks[i] !== 0) {
        newPoints[team(i)] -= 200;
      }
      if (bids[i] === '0' && iTricks[i] === 0) {
        newPoints[team(i)] += 100;
      }
      if (bids[i] === '0' && iTricks[i] !== 0) {
        newPoints[team(i)] -= 100;
      }
    }

    // non-zero games

    if (iBids[0] + iBids[3] <= iTricks[0] + iTricks[3]) {
      newPoints[0] += (iBids[0] + iBids[3]) * 10;
      newBags[0] += iTricks[0] + iTricks[3] - (iBids[0] + iBids[3]);
    }

    if (iBids[0] + iBids[3] > iTricks[0] + iTricks[3]) {
      newPoints[0] -= (iBids[0] + iBids[3]) * 10;
    }

    if (iBids[1] + iBids[2] <= iTricks[1] + iTricks[2]) {
      newPoints[1] += (iBids[1] + iBids[2]) * 10;
      newBags[1] += iTricks[1] + iTricks[2] - (iBids[1] + iBids[2]);
    }

    if (iBids[1] + iBids[2] > iTricks[1] + iTricks[2]) {
      newPoints[1] -= (iBids[1] + iBids[2]) * 10;
    }

    let nextPoints: number[] = [
      gameData.points[0] + newPoints[0] + newBags[0],
      gameData.points[1] + newPoints[1] + newBags[1],
    ];

    // add new ScoreBoard line

    let line: (string | number)[] = [];
    for (let i = 0; i < 4; i++) {
      line.push(bids[i]);
      line.push(tricks[i]);
    }
    line.push(newPoints[0] + newBags[0]);
    line.push(newPoints[1] + newBags[1]);
    gameData.addScoreLine(line);

    // reset bid and tricks dropdowns

    setBids(['-', '-', '-', '-']);
    setTricks(['-', '-', '-', '-']);
  };

  // handle changes to big and tricks dropdowns
  const handleBidChange = (text, idx) => {
    setBids(
      bids.map((x, index) => {
        return idx === index ? text : x;
      })
    );
  };

  const handleTricksChange = (text, idx) => {
    setTricks(
      tricks.map((x, index) => {
        return idx === index ? text : x;
      })
    );
  };

  // calculate dimensions of PlayerCard
  const tileDimensions = calcTileDimensions(
    dimensions.height,
    dimensions.width,
    2
  );

  return (
    <View style={styles.backDrop}>
      <AlertModal
        visible={modalVisible}
        text={modalText}
        buttons={[{ title: 'OK', onPress: () => setModalVisible(false) }]}
      />
      <View style={styles.container}>
        {[1, 2, 3, 4].map((i, idx) => (
          <PlayerCard
            key={i.toString()}
            playerNumber={i}
            bidValue={bids[idx]}
            tricksValue={tricks[idx]}
            onChangeBid={(text) => handleBidChange(text, idx)}
            onChangeTricks={(text) => handleTricksChange(text, idx)}
            points={gameData.points[team(idx)]}
            bags={gameData.bags[team(idx)]}
            height={tileDimensions.height}
            width={tileDimensions.width}
            margin={tileDimensions.margin}
            backgroundColor={
              team(idx) === 0 ? colors.t1CardColor : colors.t2CardColor
            }
            contentColor={
              team(idx) === 0 ? colors.t1CardTextColor : colors.t2CardTextColor
            }
            pointsHighlight={
              team(idx) === 0
                ? colors.t1PointsHighlight
                : colors.t2PointsHighlight
            }
          />
        ))}
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          //backgroundColor: 'yellow',
        }}
      >
        <Button
          title='Finish Round'
          onPress={() => finishRound()}
          buttonStyle={styles.sbButton}
        />
      </View>
    </View>
  );
};

// calculate dimensions helper
const calcTileDimensions: (
  height: number,
  windowWidth: number,
  tpr: number
) => { height: number; width: number; margin: number } = (
  windowHeight,
  windowWidth,
  tpr
) => {
  const margin: number = (windowHeight / tpr) * 0.015;
  const height: number =
    windowHeight / 2 - styles.sbButton.height - getStatusBarHeight() - 3;
  const width: number = (windowWidth - margin * (tpr * 2)) / tpr;
  return {
    height: Math.floor(height),
    width: Math.floor(width),
    margin: Math.floor(margin),
  };
};

export default Scoring;

const styles = StyleSheet.create({
  backDrop: {
    flex: 1,
    backgroundColor: colors.backDropColor,
  },
  container: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sbButton: {
    height: 45,
    backgroundColor: colors.finishButtonColor,
  },
});
