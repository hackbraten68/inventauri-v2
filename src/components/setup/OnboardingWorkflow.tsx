import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
    Building2,
    UserPlus,
    Warehouse as WarehouseIcon,
    Store,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    PackageCheck
} from 'lucide-react';

type SetupStep = 'admin' | 'shop' | 'infrastructure' | 'success';

export function OnboardingWorkflow() {
    const [step, setStep] = React.useState<SetupStep>('admin');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Form State
    const [adminData, setAdminData] = React.useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [shopData, setShopData] = React.useState({
        name: 'Mein Inventauri Shop',
        legalName: '',
        address: 'Musterstraße 1, 12345 Berlin'
    });

    const [infraData, setInfraData] = React.useState({
        createDemoItems: true,
        createDemoPOS: true
    });

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminData.password !== adminData.confirmPassword) {
            setError('Passwörter stimmen nicht überein.');
            return;
        }
        setError(null);
        setStep('shop');
    };

    const handleShopSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('infrastructure');
    };

    const handleFinalSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/setup/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin: adminData,
                    shop: shopData,
                    config: infraData
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Initialisierung fehlgeschlagen.');
            }

            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Progress Multi-Step */}
            <div className="flex items-center justify-between px-4">
                {[
                    { id: 'admin', icon: UserPlus, label: 'Eigentümer (CEO)' },
                    { id: 'shop', icon: Building2, label: 'Unternehmen' },
                    { id: 'infrastructure', icon: PackageCheck, label: 'Setup' }
                ].map((s, i) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isDone = ['shop', 'infrastructure', 'success'].includes(step) && i === 0 ||
                        ['infrastructure', 'success'].includes(step) && i === 1 ||
                        step === 'success' && i === 2;

                    return (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-2 group">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary/10 text-primary scale-110 shadow-lg' :
                                    isDone ? 'border-green-500 bg-green-50 text-green-500' : 'border-muted text-muted-foreground'
                                    }`}>
                                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < 2 && (
                                <div className={`h-[2px] flex-1 mx-4 transition-colors duration-500 ${isDone ? 'bg-green-500' : 'bg-muted'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <Card className="border-none shadow-premium ring-1 ring-border/50 bg-card/80 backdrop-blur-xl transition-all">
                {step === 'admin' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Step 1</Badge>
                                <CardTitle className="text-xl">Eigentümer (CEO) erstellen</CardTitle>
                            </div>
                            <CardDescription>
                                Erstellen Sie den Hauptzugang für Ihr Unternehmen. Dieser Account wird für den täglichen Betrieb genutzt.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdminSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Admin E-Mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@firma.de"
                                        required
                                        value={adminData.email}
                                        onChange={e => setAdminData({ ...adminData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pass">Passwort</Label>
                                        <Input
                                            id="pass"
                                            type="password"
                                            required
                                            value={adminData.password}
                                            onChange={e => setAdminData({ ...adminData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Bestätigen</Label>
                                        <Input
                                            id="confirm"
                                            type="password"
                                            required
                                            value={adminData.confirmPassword}
                                            onChange={e => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {error && <p className="text-sm text-destructive font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/20">{error}</p>}
                                <Button type="submit" className="w-full h-11">
                                    Weiter zum Unternehmen <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </div>
                )}

                {step === 'shop' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/20">Step 2</Badge>
                                <CardTitle className="text-xl">Unternehmensprofil</CardTitle>
                            </div>
                            <CardDescription>
                                Geben Sie die Basisdaten Ihres Shops oder Unternehmens an. Diese erscheinen später auf Belegen und in den Berichten.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleShopSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shopName">Shop Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="shopName"
                                            className="pl-10"
                                            placeholder="z.B. Coffee Roastery HQ"
                                            required
                                            value={shopData.name}
                                            onChange={e => setShopData({ ...shopData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="legal">Rechtlicher Name (Optional)</Label>
                                    <Input
                                        id="legal"
                                        placeholder="Müller & Co. OHG"
                                        value={shopData.legalName}
                                        onChange={e => setShopData({ ...shopData, legalName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="addr">Firmenadresse</Label>
                                    <Input
                                        id="addr"
                                        placeholder="Straße, Hausnummer, PLZ & Stadt"
                                        required
                                        value={shopData.address}
                                        onChange={e => setShopData({ ...shopData, address: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                                    Lager & POS konfigurieren <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button variant="ghost" type="button" onClick={() => setStep('admin')} className="w-full text-muted-foreground">Zurück</Button>
                            </form>
                        </CardContent>
                    </div>
                )}

                {step === 'infrastructure' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-orange-500/5 text-orange-500 border-orange-500/20">Step 3</Badge>
                                <CardTitle className="text-xl">Infrastruktur & Startmenü</CardTitle>
                            </div>
                            <CardDescription>
                                Wir legen automatisch Ihr Zentrallager an. Möchten Sie zusätzliche Beispiel-Daten generieren?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <WarehouseIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Standard HQ & Lager</p>
                                            <p className="text-xs text-muted-foreground">Wird immer als Hauptstandort erstellt.</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">Erforderlich</Badge>
                                </div>

                                <div
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${infraData.createDemoPOS ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                        }`}
                                    onClick={() => setInfraData({ ...infraData, createDemoPOS: !infraData.createDemoPOS })}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Store className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">POS Demo-Standort</p>
                                            <p className="text-xs text-muted-foreground">Erstellt einen Beispiel-Verkaufsort in der Innenstadt.</p>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${infraData.createDemoPOS ? 'border-primary bg-primary' : 'border-muted'}`}>
                                        {infraData.createDemoPOS && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${infraData.createDemoItems ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                        }`}
                                    onClick={() => setInfraData({ ...infraData, createDemoItems: !infraData.createDemoItems })}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                            <UserPlus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Beispiel Produkte & Bestände</p>
                                            <p className="text-xs text-muted-foreground">Füllt Ihr Inventar mit Kaffeebohnen & Zubehör.</p>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${infraData.createDemoItems ? 'border-primary bg-primary' : 'border-muted'}`}>
                                        {infraData.createDemoItems && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-sm text-destructive font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/20">{error}</p>}

                            <Button
                                onClick={handleFinalSetup}
                                className="w-full h-12 text-lg font-bold shadow-lg"
                                disabled={loading}
                            >
                                {loading ? 'Instanz wird konfiguriert...' : 'Setup abschließen'}
                            </Button>
                        </CardContent>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black">Installation Fertig!</h2>
                            <p className="text-muted-foreground">Ihr Inventauri Dashboard ist nun einsatzbereit. Wir haben Ihren Admin-Account und das Unternehmen erstellt.</p>
                        </div>
                        <Separator />
                        <div className="grid gap-3">
                            <Button className="h-11 w-full" onClick={() => window.location.href = '/login'}>
                                Zum Login
                            </Button>
                            <p className="text-[10px] text-muted-foreground italic">Hinweis: Melden Sie sich mit den eben erstellten Zugangsdaten an.</p>
                        </div>
                    </div>
                )}
            </Card>

            <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium opacity-50">Inventauri Self-Hosted Engine v0.1.0-alpha</p>
            </div>
        </div>
    );
}
