class Player {
  constructor(
    socketId,
    playerId,
    playerName,
    chipsAmount,
    isPremium,
    avatarUrl,
    isAdmin,
    phone,
    ip,
  ) {
    this.socketId = socketId;
    this.id = playerId;
    this.name = playerName;
    this.bankroll = chipsAmount;
    this.isPremium = Boolean(isPremium);
    this.avatarUrl = avatarUrl || null;
    this.isAdmin = Boolean(isAdmin);
    this.phone = phone || null;
    this.ip = ip || null;
  }
}

module.exports = Player;
