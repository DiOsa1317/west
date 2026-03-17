import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower);
    }
    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions()];
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6) {
        super(name, maxPower);
    }
    attack(gameContext, continuation) {
        const allOppositeCards = gameContext.oppositePlayer.table;
        const taskQueue = new TaskQueue();

        for (let position = 0; position < allOppositeCards.length; position++) {
            taskQueue.push(onDone => {
                const oppositeCard = allOppositeCards[position];
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}
class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2) {
        super(name, maxPower);
    }

    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };

}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5) {
        super(name, maxPower);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(value - 1);
        })
    }

    getDescriptions() {
        return [super.getDescriptions(), 'Описание способности:\n Получает на 1 меньше урона'];
    }
}

class Lad extends Dog {
    constructor(name = 'Браток', maxPower = 2) {
        super(name, maxPower);
    }
    static inGameCount;
    static getInGameCount() { return this.inGameCount || 0; }
    static setInGameCount(value) { this.inGameCount = value; }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }
    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Math.max(Lad.getInGameCount() - 1, 0));
        continuation();
    }
    static getBonus() {
        const currentCount = this.getInGameCount();
        return currentCount * (currentCount + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions() {
        if (!Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            return super.getDescriptions();
        }
        return [super.getDescriptions(), "Чем их больше, тем они сильнее"];
    }
}

class PseudoDuck extends Dog {
    constructor(name = 'Псевдоутка', maxPower = 3) {
        super(name, maxPower);
    }
    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class Brewer extends Duck {
    constructor(name = 'Пивовар', maxPower = 2) {
        super(name, maxPower);
    }
    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const allCards = currentPlayer.table.concat(oppositePlayer.table)

        const taskQueue = new TaskQueue();

        for (let position = 0; position < allCards.length; position++) {
            taskQueue.push(onDone => {
                const card = allCards[position];
                if (card) {
                    card.maxPower++;
                    card.currentPower += 2;
                    card.view.signalHeal()
                    card.updateView()
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);

    }
}

const seriffStartDeck = [
    new Duck(),
    new Brewer(),
];
const banditStartDeck = [
    new Dog(),
    new Dog(),
    new Dog(),
    new Dog(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});