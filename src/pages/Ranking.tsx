import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Gift, ChevronRight, User as UserIcon, Info, TrendingUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getEffectiveClientId } from '../lib/tenant';

interface RankingPageProps {
  user: User;
}

export default function RankingPage({ user }: RankingPageProps) {
  const effectiveClientId = getEffectiveClientId(user);
  const isPlayerUser = user.role === 'client';
  const [ranking, setRanking] = useState<{ id: string, name: string, points: number }[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [lastPoints, setLastPoints] = useState<{ points: number, isPromo: boolean } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isPlayerUser) {
        setRanking([]);
        setUserPoints(0);
        setLastPoints(null);
        return;
      }

      const clientId = effectiveClientId;
      const clientIdForQuery = clientId || undefined;
      const currentRanking = await dataService.getRanking(clientIdForQuery);
      setRanking(currentRanking);
      const identifier = user.role === 'client' && user.phone ? user.phone : user.id;
      const points = await dataService.getUserPoints(identifier, clientIdForQuery);
      setUserPoints(points);
      
      // Calculate last points
      const hasCompleted = await dataService.hasCompletedBookings(identifier, clientIdForQuery);
      if (hasCompleted) {
        setLastPoints({ points: 1, isPromo: false }); // Points logic simplified to 1 per completed booking
      }
    };
    fetchData();
  }, [effectiveClientId, isPlayerUser, user.id, user.phone, user.role]);

  const identifier = user.role === 'client' && user.phone ? user.phone : user.id;
  const userPosition = ranking.findIndex(p => p.id === identifier) + 1;
  const pointsToFreeTurn = 100;
  const progress = Math.min(100, (userPoints % pointsToFreeTurn));

  const prizes = [
    { id: 1, name: 'Bebida Gratis', points: 50, icon: Medal, description: 'Cualquier bebida de 500ml' },
    { id: 2, name: 'Turno Gratis F5', points: 100, icon: Trophy, description: 'Válido para lunes a jueves' },
    { id: 3, name: 'Camiseta Oficial', points: 500, icon: Star, description: 'Edición limitada Golazo' },
  ];

  return (
    <div className="w-full space-y-5 pb-20">
      <header className="relative overflow-hidden rounded-[28px] bg-zinc-900 p-4 text-white shadow-2xl sm:p-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="neutral" className="bg-sky-500/20 text-sky-400 border-sky-500/30 px-3 py-1">
              TEMPORADA MARZO 2026
            </Badge>
            <h1 className="text-2xl font-black tracking-tighter sm:text-4xl">Ranking Mensual</h1>
            <p className="text-sm font-medium text-zinc-400 sm:text-base">
              Sumá puntos reservando y jugá más para ganar premios.
            </p>
          </div>
          {userPosition > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/40">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Tu Posición</p>
                <p className="text-2xl font-black">Estás #{userPosition} <span className="text-xs font-bold text-sky-400">este mes</span></p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* User Status & Progress */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="relative overflow-hidden rounded-[28px] border-none bg-sky-600 text-white shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Target className="h-20 w-20 rotate-12 sm:h-24 sm:w-24" />
            </div>
            <CardContent className="relative z-10 space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Puntos Acumulados</p>
                  <motion.p 
                    key={userPoints}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black sm:text-5xl"
                  >
                    {userPoints}
                  </motion.p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-md sm:h-14 sm:w-14">
                  <Star className="h-6 w-6 fill-white text-white sm:h-7 sm:w-7" />
                </div>
              </div>

              {lastPoints && (
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 inline-flex items-center gap-2">
                  <span className="text-xs font-bold">
                    Última reserva: <span className="text-yellow-300">+{lastPoints.points} puntos</span>
                    {lastPoints.isPromo && " promo"}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                  <span>Próximo Premio</span>
                  <span>{userPoints % pointsToFreeTurn} / {pointsToFreeTurn}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  />
                </div>
                <p className="text-xs font-bold text-white/80 text-center leading-relaxed">
                  ¡Te faltan <span className="text-yellow-300 font-black">{(pointsToFreeTurn - (userPoints % pointsToFreeTurn)).toFixed(1)} puntos</span> para tu próximo regalo!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-xl">
            <CardHeader className="pb-2">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />
                Premios
              </h3>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {prizes.map((prize) => {
                const isUnlocked = userPoints >= prize.points;
                const pointsNeeded = prize.points - userPoints;
                
                return (
                  <motion.div 
                    key={prize.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
                      isUnlocked 
                        ? "bg-emerald-50 border-emerald-100" 
                        : "bg-zinc-50 border-zinc-100 opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors",
                        isUnlocked ? "bg-emerald-500 text-white" : "bg-white text-zinc-400"
                      )}>
                        <prize.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-zinc-900">{prize.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{prize.description}</p>
                      </div>
                      <div className="text-right">
                        {isUnlocked ? (
                          <Badge variant="success" className="bg-emerald-500 text-white border-none">Canjear</Badge>
                        ) : (
                          <p className="text-[10px] font-black text-zinc-400 uppercase">Faltan {pointsNeeded.toFixed(1)} pts</p>
                        )}
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="mt-3 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 transition-all" 
                          style={{ width: `${Math.min(100, (userPoints / prize.points) * 100)}%` }} 
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-3 rounded-[24px] bg-zinc-900 p-4 text-white">
            <div className="flex items-center gap-2 text-sky-400">
              <Info className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">¿Cómo funciona?</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Sumás puntos cada vez que reservás y jugás. Los horarios con menor demanda dan más puntos.
            </p>
          </div>
        </div>

        {/* Ranking List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className={cn(
              "text-xl font-black flex items-center gap-3 tracking-tight sm:text-2xl",
              user.role === 'client' ? "text-white" : "text-zinc-900"
            )}>
              <Trophy className="w-8 h-8 text-yellow-500" />
              Tabla de Posiciones
            </h2>
            <Badge variant="neutral" className="font-black">TOP 50</Badge>
          </div>

          <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-xl">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50">
                {ranking.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <p className="font-bold">
                      {isPlayerUser ? 'El ranking público estará disponible cuando el complejo habilite estadísticas públicas.' : 'Aún no hay jugadores en el ranking'}
                    </p>
                  </div>
                ) : (
                  ranking.map((player, index) => {
                    const isTop3 = index < 3;
                    const isUser = player.id === user.id;
                    const nextPlayer = ranking[index - 1];
                    const diff = nextPlayer ? (nextPlayer.points - player.points).toFixed(1) : null;

                    return (
                      <motion.div 
                        key={player.id} 
                        whileHover={{ backgroundColor: "rgba(244, 244, 245, 0.5)" }}
                        className={cn(
                          "p-3 sm:p-4 flex items-center justify-between transition-all relative group",
                          isUser ? "bg-sky-50/80" : ""
                        )}
                      >
                        {isUser && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500" />}
                        
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base shadow-sm",
                            index === 0 ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-yellow-500/20" :
                            index === 1 ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white shadow-zinc-400/20" :
                            index === 2 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/20" :
                            "bg-zinc-50 text-zinc-400"
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className={cn(
                              "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors",
                              isUser ? "bg-sky-500 text-white" : "bg-zinc-100 text-zinc-400"
                            )}>
                              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <p className={cn("font-black text-sm sm:text-base truncate max-w-[120px] sm:max-w-none", isUser ? "text-sky-600" : "text-zinc-900")}>
                                  {player.name}
                                </p>
                                {isUser && <Badge variant="neutral" className="bg-sky-500 text-white border-none text-[8px] px-1 sm:px-2">TÚ</Badge>}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                                <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {index === 0 ? "Leyenda" : index < 5 ? "Pro" : "Aficionado"}
                                </p>
                                {diff && diff !== "0.0" && (
                                  <span className="text-[8px] sm:text-[9px] font-black text-sky-500">+{diff} pts</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg sm:text-2xl font-black", isTop3 ? "text-zinc-900" : "text-zinc-500")}>
                            {player.points}
                          </p>
                          <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Puntos</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
