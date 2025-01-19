import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isMonday, startOfDay } from 'date-fns';

const DATA_FILE = path.join(process.cwd(), 'data.json');

async function readData() {
  try {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    // If the file doesn't exist or is empty, return an empty object
    return { availability: {}, votes: null, userVotes: {}, lastReset: null };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readData();
    const today = new Date();
    
    if (isMonday(today) && (!data.lastReset || new Date(data.lastReset) < startOfDay(today))) {
      // Reset data if it's Monday and hasn't been reset today
      data.availability = {};
      data.votes = null;
      data.userVotes = {};
      data.lastReset = today.toISOString();
      await writeData(data);
    }
    
    console.log('GET request, returning data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newData = await request.json();
    console.log('POST request, received data:', newData);
    const existingData = await readData();
    
    if (newData.reset) {
      // Reset data on explicit reset request
      existingData.availability = {};
      existingData.votes = null;
      existingData.userVotes = {};
      existingData.lastReset = new Date().toISOString();
    } else {
      // Update data normally
      const updatedData = { 
        ...existingData, 
        ...newData,
        userVotes: { ...existingData.userVotes, ...newData.userVotes }
      };
      Object.assign(existingData, updatedData);
    }
    
    await writeData(existingData);
    console.log('POST request, updated data:', existingData);
    return NextResponse.json(existingData);
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
