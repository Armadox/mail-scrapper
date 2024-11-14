'use client'

import { useState } from 'react';
import {useProgress} from '../../../hooks/loading-hook'
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import Link from 'next/link';
import { AlertCircle } from "lucide-react"
 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"


type PlaceWithEmail = {
    name: string;
    address: string;
    website?: string | null;
    email?: string | null;
}

type ProgressType = {
    websiteCount: number;
    setWebsiteCount: (websiteCount: number) => void;
    mailCount: number;
    setMailCount: (mailCount : number) => void;
}

export default function Home() {
    const [searchString, setSearchString] = useState<string>("")
    const [apiKey, setApiKey] = useState<string>("")
    const [emails, setEmails] = useState<PlaceWithEmail[]>([]);
    const [loading, setLoading] = useState<boolean>(false)
    const [noApi, setNoApi] = useState<boolean>(false)
    const {websiteCount, setWebsiteCount, mailCount, setMailCount}: ProgressType = useProgress();

    const exportToExcel = (emails: PlaceWithEmail[]) => {
        const data = emails.map(place => ({
            Name: place.name,
            Address: place.address,
            Website: place.website || " ",
            Email: place.email || " ",
        }));

        setLoading(false)
    
        const ws = XLSX.utils.json_to_sheet(data);
        
        ws['!cols'] = [
            { wch: 100 },
            { wch: 60 },
            { wch: 30 },
            { wch: 30 },
        ];
    
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Places");
        const excelFile = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    
        const blob = new Blob([excelFile], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${searchString}.xlsx`;
        link.click();
    };

    const fetchPlaces = async () => {
        const response = await fetch('/api/scrapePlaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                searchString: searchString, 
                apiKey: apiKey
            }),
        });
        if(response.status === 401){
            alert("PLEASE CHECK YOUR GOOGLE API!")
            return;
        }
        const data: { name: string; address: string; website?: string }[] = await response.json();
        setWebsiteCount(data.length)
        return data
    };

    const fetchEmails = async () => {
        if(!apiKey){
            setNoApi(true)
            return;
        }
        setNoApi(false)
        const places = await fetchPlaces();

        if(!places){
            return;
        }

        const placesWithEmails = await Promise.all(
            places.map(async (place: PlaceWithEmail) => {
                if (place.website) {
                    try {
                        const response = await fetch('/api/site-scraper', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: place.website }),
                        });
                        const data = await response.json();
                        if (data) {
                            // @ts-expect-error Ignore This TypeError
                            setMailCount(prev => prev + 1);
                        }
                        return { ...place, email: data.email || null };
                    } catch (error) {
                        console.error(`Error fetching email for ${place.website}:`, error);
                        // @ts-expect-error Ignore This TypeError
                        setMailCount(prev => prev + 1);
                        return { ...place, email: null };
                    }
                } else {
                    // @ts-expect-error Ignore This TypeError
                    setMailCount(prev => prev + 1);
                    return { ...place, email: null };
                }
            })
    );
    setEmails(placesWithEmails);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true)
        setEmails([]);
        setWebsiteCount(0);
        setMailCount(0);
        await fetchEmails();
    };

    const logEmails = async (e: React.FormEvent) => {
        e.preventDefault();
        exportToExcel(emails)
    };

    return (
        <div className="max-w-[1000px] flex-1">
            <h1>Email Scrapper V1.0</h1>
            {noApi &&
            <Alert variant="destructive" className='my-9 border-red-800 text-red-800'>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing API or Search</AlertTitle>
                <AlertDescription>
                    Please insert a valid Google API or a valid String into the search input.
                </AlertDescription>
            </Alert>
            }
            {process.env.NODE_ENV === 'production' &&
            <Alert variant="destructive" className='my-9 border-red-800 text-red-800'>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>This will only work localy.</AlertTitle>
                <AlertDescription>
                    Headless browser operations are blocked on cloud hosting platforms.
                </AlertDescription>
            </Alert>
            }
            {websiteCount > 0 && (
                <Progress className='max-w-[400px]' value={(mailCount / websiteCount) * 100} />
            )}
            <form onSubmit={handleSubmit} className="my-5">
                <div className="grid w-full max-w-sm items-center gap-1.5 my-3">
                    <Label>Api Key: </Label>
                    <Input required type="text" onChange={e => setApiKey(e.target.value)} value={apiKey}/>
                    <div className='text-xs'>You can get a Google API from the Google cloud Console.</div>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5 my-3">
                    <Label>Search: </Label>
                    <Input required type="text" onChange={e => setSearchString(e.target.value)} value={searchString}/>
                    <div className='text-xs'>Insert something like `&quot;`Bayern Yoga`&quot;`.</div>
                </div>
                <Button type="submit" className="my-3 bg-slate-100 text-gray-950 hover:bg-slate-300 hover:text-black" disabled={(websiteCount !== mailCount) || loading}>
                    {websiteCount !== mailCount ? (
                        <>
                            <Loader2 className="animate-spin" />
                            <span>Searching for E-Mails</span>
                        </>
                    ) : (<span>Search</span>)}
                </Button>
            </form>
            <Table className="text-xs">
            <TableCaption>A list of your scrapped emails.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead className="text-right">Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {emails.map((place, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{place.name}</TableCell>
                        <TableCell>{place.address}</TableCell>
                        <TableCell><Link href={place.website || "#"}>{place.website || "-"}</Link></TableCell>
                        <TableCell className="text-right">{place.email || "-"}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                <TableRow>
                    <TableCell colSpan={3}>Total Emails:</TableCell>
                    <TableCell className="text-right">{mailCount}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            {websiteCount === mailCount && mailCount > 0 &&
            <div className="flex items-center justify-center">
                <Button className="my-3 bg-slate-100 text-gray-950 hover:bg-slate-300 hover:text-black" onClick={logEmails}>
                    Download Excel
                </Button>
            </div>
            }
        </div>
    );
}
