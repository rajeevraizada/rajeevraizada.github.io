%%%% Tutorial on the basics of convolving with an HRF, using Matlab
%%%% Written by Rajeev Raizada, July 23, 2002.
%%%% 
%%%% There is also a follow-up file about the structure of 
%%%% an fMRI-analysis design matrix: design_matrix_tutorial.m
%%%%
%%%% Neither file assumes any prior knowledge of linear algebra or Matlab.
%%%%
%%%% Probably the best way to look at this program is to read through it
%%%% line by line, and paste each line into the Matlab command window
%%%% in turn. That way, you can see what effect each individual command has.
%%%%
%%%% Alternatively, you can run the program directly by typing 
%%%%
%%%%   hrf_tutorial
%%%%
%%%% into your Matlab command window. 
%%%% Do not type ".m" at the end
%%%% If you run the program all at once, all the Figure windows
%%%% will get made at once and will be sitting on top of each other.
%%%% You can move them around to see the ones that are hidden beneath.
%%%%
%%%% Anything in this program with a % sign in front of it is a comment.
%%%% These will probably show up red in your Matlab Editor.
%%%% Everything else is a Matlab command, that you can copy and
%%%% paste into the Matlab command window.
%%%%
%%%% Please mail any comments or suggestions to: raj@nmr.mgh.harvard.edu

% 1. The brain produces a fairly fixed, stereotyped blood flow response
%    every time a stimulus hits it. That's the HRF (haemodynamic response
%    function).
%
% 2. Once one of these resonses starts, it just does its thing until it
%    has finished. i.e. it peaks, it goes back down to zero, it undershoots 
%    a bit, then it settles back to baseline. All this was kicked off as a
%    a result of the stimulus coming in, and it will run to completion
%    regardless of what stimuli, if any, come in later.
%    (This is just an approximation of what really happens in the brain, of 
%    course, but it turns out that it isn't all that far from being true).
%
% 3. What we just described is exactly what the process called "convolution"
%    is. To convolve, you need two things. First, you need an "impulse 
%    response function" (IRF), i.e. the chain of events that will be started 
%    off every time an "impulse" happens, e.g. the brain sees a stimulus.
%    And in the brain, the response to each impulse is the haemodynamic
%    response function --- the HRF. Every time a stimulus comes in, one
%    of these HRFs gets started off, and then it runs it course (peak, 
%    undershoot, baseline) over the next 16 seconds or so.
%
%    Second, you need a vector to be convolved with that impulse response
%    function. A vector is just a bunch of numbers in a row. In this case,
%    our vector to be convolved is a list of whether a stimulus is shown
%    or not, at each moment in time. So, we have a bunch of numbers
%    lined up in a row, with time being represented by our position 
%    along the row. 
%    This type of vector is often referred to as a time-series. 
%    
%    In this case, the time-series is describing whether a stimulus is
%    being shown at that moment in time or not.
%    If there's no stimulus, we put a zero.
%    If there is a stimulus, we put a 1.
%    The first number is what is happening at time t=0, 
%    the second number is what is happening at t=1 etc.
%
%    Here's a key point: every stimulus will kick off its own HRF, and so
%    it can often happen that the previous stimulus's HRF hasn't finished
%    by the time the next stimulus, with its new HRF comes in.
%    So, the two HRFs will overlap in time.
%
%    In convolution, if you get different impulse response functions 
%    overlapping in time, you can work out what the total response at
%    that moment in time will be simply by adding up the individual 
%    responses.
%
%    To say that you can get the total response just by adding up the
%    individual overlapping responses is exactly what it means to say
%    that the system is LINEAR. If something is linear, then its 
%    total response to separate inputs is just the sum of what its
%    individual responses would have been to the individual inputs.
%
%    Does the brain do this? Does it just "add up" blood flow responses
%    which are overlapping?
%
%    Yes! (to a reasonable approximation).
%    And that is why convolution does a reasonable job of describing
%    what the brain does.
%
%    To see more detail about the math of convolution,
%    look at the companion program math_of_convolution.m
%
% 4. In fMRI, the data that we get for each voxel is the blood
%    oxygenation at that voxel at each point in time.
%    We also know what the presentation times of our stimuli were.
%    So, what any fMRI-analysis program does is this:
%    It takes the time series of stimulus onsets, and convolves it
%    with the HRF. This gives a *prediction* of the blood flow response
%    that we should get a given voxel, if that voxel is responding to the
%    stimuli.
% 
%    Then, we take that prediction, and go and compare it against the measured
%    data. And we see how well they match.

%%%%%% First let's create a made-up vector that looks like an HRF
%%%%%% A vector is just a bunch of numbers in a row.
%%%%%% In Matlab, we make a vector by putting the row of numbers
%%%%%% inside square brackets [  ]

%%% Give one value for each 1-second time point.
%%% So, the 18 numbers in the vector below correspond
%%% to the values of the HRF from time=0 to time=18
%%% 
%%% Note that the important thing about the HRF here is 
%%% just the overall *shape* that it has, not the exact values
%%% of the numbers. So, it doesn't mean anything that the max
%%% value in the numbers below is 9, or 9.2 or whatever.
%%% It's the shape of the HRF curve over time that matters.
%%%
%%% [ Actually, this isn't completely true. 
%%%   For some math-related purposes it turns out that it's convenient
%%%   to have the HRF sum to 1, and this is what SPM does. 
%%%   But it would be a distraction to worry about that right now.
%%%   Let's just define an HRF with the right overall shape, and plot it. ]

hrf = [ 0 0 1 5 8 9.2 9 7 4 2 0 -1 -1 -0.8 -0.7 -0.5 -0.3 -0.1 0 ]
    %%% When this command runs, Matlab will show the value of the
    %%% new variable "hrf" in the Command Window.
    %%% That's because there is no semi-colon at the end of the line.
    %%% If it did have a semi-colon at the end, Matlab wouldn't show it
    
    
%%%%%%%%%%%%% Let's plot the HRF

%%%% In Matlab, the command to do this is called "plot"
%%%% You tell it three things: 
%%%%    1. The x-coordinates of the points to plot, lined up in a vector
%%%%    2. The y-coordinates of the points to plot, lined up in a vector
%%%%    3. (Optional) What styles of line and markers to use for the plot.
                
figure(1);              % Make a new figure window, Fig.1
clf;                    % Clear the figure

%%%% Make a vector of time-values to use as the x-coordinates
time_vector = [ 0:18 ];
                %%% 0:18 means "A row of numbers, starting at zero,
                %%% and going up to 18". 
                %%% The numbers increase in steps of 1, which is the default.
                %%% The square brackets make it a vector.
                %%% The semi-colon at the end means that this 
                %%% new variable will NOT display in the command window.
                %%% If you want to see that value of it, type
                %%%   time_vector
                %%% into the command window, without a semi-colon after it.

%%%% Plot HRF against time, with time_vector as the x-coordinates,
%%%% hrf as the y-coordinates, and with the line style being a
%%%% solid line with circles on it.
%%%% The way to specify "solid line with circles on it" is to
%%%% make the third argument be 'o-'

plot(time_vector,hrf,'o-');   
                      
grid on;                    % Overlay a dotted grid on the graph 

%%%% Label our axes and give the graph a title
xlabel('Time (seconds)');
ylabel('fMRI signal');
title('The typical shape of an HRF');


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Now let's make a vector of that is the time-series of our
% stimulus onsets, so that we can convolve that vector with the HRF, 
% as described in the intro above.
% 
% A vector is just a bunch of numbers in a row. In this case,
% they are lined up in time. i.e. the first number is what is happening
% at time t=0, the second number is what is happening at t=1 etc.
% Our vector to be convolved is a list of whether a stimulus is shown
% or not, at each moment in time. If there's no stimulus, we put a zero.
% If there is a stimulus, we put a 1.
%
% Suppose that our scan lasts 60 seconds, 
% and that we use a visual stimulus: we flash a light at time t=10.
%
% Let's make an stimulus-time-series vector that has one element 
% for each second of time.
% Then the vector for that light stimulus will
% have a 1 in the 10th position, meaning t=10, 
% and will be zeros everywhere else.
% 
% So, it's 9 zeros, then a 1, then 50 more zeros, 
% making the vector have 60 entries altogether, 
% for the 60 second scan.
%
% Note that by just putting a single 1 to represent the flash
% of light, we are saying that the flash happened suddenly,
% just at that moment of time, i.e. it was an event, as opposed
% to a block (also called an "epoch"), in which the stimuli 
% are spread out over a longer period of time. E.g. a stimulus-block
% might last twenty seconds, rather than an event, which happens
% at a single moment.
%
% This sudden flash of light will spark off a sudden neural event,
% in this case a sudden burst of neural firing in visual cortex.
%
% In Matlab, we can make nine zeros in a row, or 50 zeros in a row,
% using the command "zeros".
% The first argument is how many rows we want (just one row in this case),
% and the second argument is how many columns we want ( nine or fifty ).
%
% To make the whole big vector with 9 zeros, a single 1, and then 50 zeros,
% we can just put the separate vectors next to each other in a row,
% and then put the whole thing inside square brackets, like this:

first_light_stim_time_series = [  zeros(1,9) 1 zeros(1,50) ];

%%%%%%% Translation-guide
%
% Here we have made a time-series whether for every time-point (t=0,t=1,etc.)
% we are explicitly saying whether or not a stimulus is being shown.
% In this case, the light is shown at t=10, so put a 1 as the 10th element,
% and for the rest of the time no lights are shown, 
% so we put 0 everywhere else.
%
% However, when using an fMRI-analysis package, people typically don't
% explicity make the whole time-series. They simply tell the package
% what the onset-times of the stimuli are, and let the package build
% the time-series of 0's and 1's on its own.
%
% So, for the case where we have a single light stimulus at t=10,
% the info entered into the analysis package would be something like:
% 
% onset_times = [ 10 ];
%
% Similarly, if we flashed one light at t=10 and another at t=30,
% then we'd enter:
% onset_times = [ 10 30 ];
%
% In this tutorial, and also in design_matrix_tutorial,
% we're going to explicitly make the stimulus-time-series vectors,
% rather than only supplying the onset-times, because these time-series
% vectors are the things that actually get convolved with the HRF.
% In an fMRI-analysis package, these time-series vectors would 
% get made and convolved "behind the scenes", but we want to see
% everything in full view!

%%%% Now that we have the stimulus-time-series vector and the HRF vector,
%%%% we can convolve them.
%%%% In Matlab, the command to convolve two vectors is "conv", like this:

hrf_convolved_with_stim_time_series = conv(first_light_stim_time_series,hrf);

%%%%% Let's plot the result 

figure(2);       % Make a new figure window, Fig.2
clf;             % Clear the figure

subplot(2,1,1);  % This is just to make the plots line up prettily
                 % The first number is how many rows of subplots we have: 2
                 % The second number is how many columns: 1
                 % The third number is which subplot to draw in: the first one
                 % So, we end up with two plots stacked on top of each other,
                 % and we draw in the first one (which is the upper subplot)
                 
stem(first_light_stim_time_series);
                 % Show when the stimulus is presented.
                 % We're using the command "stem" to plot here, instead
                 % of the more standard command "plot".
                 % "Stem" makes a nice looking plot with lines and circles.
                 % This type of plot is good for showing discrete events,
                 % such as stimulus onsets.
                 
grid on;         % Overlay a dotted-line grid on top of the plot

legend('Time-series of light stim');  
                 % Make a box to say what the plot-lines are showing 

axis([0 60 0 1.2]); % This just sets the display graph axis size
                    % The first two numbers are the x-axis range: 0 to 60
                    % The last two numbers are the y-axis range: 0 to 1.2
xlabel('Time (seconds)');
ylabel('Stimulus present / absent');

subplot(2,1,2);     % Draw in the second subplot (the lower one)

plot(hrf_convolved_with_stim_time_series,'rx-');
            % The argument 'rx-' means: Draw in red (r), 
            % use cross-shaped markers (x), and join them with a solid line (-)
grid on;
legend('Stimulus time-series convolved with HRF');
axis([0 60 -2 15]);
xlabel('Time (seconds)');
ylabel('fMRI signal');

% You might be wondering why we didn't specify an x-coordinate
% vector in the two plot commands just now.
%
% e.g. plot(hrf_convolved_with_stim_time_series,'rx-')
%
% We gave the y-coord values: the vector "hrf_convolved_with_stim_time_series"
% But we didn't give any x-coord values.
% When the plot command is given just one vector, it automatically
% plots the first value at x=1, the second at x=2 etc.
% Because the time-axis that we want in these plots 
% starts at 1 and goes up in steps of 1, this default is fine for us here.

%%%%%% Display another light, now at time 30
%%%%%% Make a new stimulus-time-series vector for it,
%%%%%% just like we did above.
%%%%%% Except now there are 29 zeros, then a 1, then 30 zeros

second_light_stim_time_series = [  zeros(1,29) 1 zeros(1,30) ];

%%%%%% Because the two vectors first_light_stim_time_series
%%%%%% and second_light_stim_time_series are the same length
%%%%%% (they are both 60 elements long, for the 60 second scan),
%%%%%% we can add them together, element-by-element.
%%%%%%
%%%%%% This will make a new vector that has a 1 as the 10th element,
%%%%%% and a 1 as the 30th element, and is zeros everywhere else.
%%%%%%
%%%%%% This represents us showing lights at t=10 and t=30 
                                        
all_lights_time_series =  ... % Three dots mean "continued on next line"
     first_light_stim_time_series + second_light_stim_time_series;

%%%%% Do the convolution using the Matlab command "conv"
hrf_convolved_with_all_lights_time_series = conv(all_lights_time_series,hrf);

%%%%% Let's plot the result of this convolution, in a new figure

figure(3);
clf;                % Clear the figure
subplot(2,1,1);     % This is just to make the plots line up prettily
stem(all_lights_time_series);
grid on;
legend('Time-series of light stim');
axis([0 60 0 1.2]);
xlabel('Time (seconds)');
ylabel('Stimulus present / absent');

subplot(2,1,2);
plot(hrf_convolved_with_all_lights_time_series,'rx-');
grid on;
legend('Stimulus time-series convolved with HRF');
axis([0 60 -2 15]);
xlabel('Time (seconds)');
ylabel('fMRI signal');

%%%%%% Now let's try moving the two stimulus onsets closer together
%%%%%% This will show how the two HRFs add together to make the measured signal

second_light_stim_time_series = [  zeros(1,15) 1 zeros(1,44) ];
                % A flash of light, with onset-time t=16
                    
all_lights_time_series =  ... % Three dots mean "continued on next line"
     first_light_stim_time_series + second_light_stim_time_series;
                % Onsets at t=10 and t=16

hrf_convolved_with_all_lights_time_series = conv(all_lights_time_series,hrf);

hrf_from_first_light = conv(first_light_stim_time_series,hrf);

hrf_from_second_light = conv(second_light_stim_time_series,hrf);

figure(4);
clf;               % Clear the figure
subplot(3,1,1);    % This lines up three subplots on this figure window
stem(all_lights_time_series,'bo-');    % Blue circles, solid line
grid on;
legend('Time-series of light stim');
axis([0 60 0 1.2]);
ylabel('Stimulus present / absent');

subplot(3,1,2);
plot(hrf_convolved_with_all_lights_time_series,'rx-'); % Red crosses, solid line           
grid on;
legend('Stimulus time-series convolved with HRF');
axis([0 60 -2 15]);
ylabel('fMRI signal');

subplot(3,1,3);
hold on;   % "Hold" is one way of putting more than one plot on a figure

plot(hrf_from_first_light,'b-');             % Blue solid line
plot(hrf_from_second_light,'m--');           % Magenta dashed line

hold off;
grid on;
legend('HRF from first flash of light','HRF from second flash of light');
axis([0 60 -2 15]);
xlabel('Time (seconds)');
ylabel('fMRI signal');

% Now let's put in a third onset, so we have onsets at t=10, t=13 and t=16.
% Having all these trials following each other in a row is starting to 
% look like a blocked design. 
% When we plot the HRF that these closely-spaced trials evoke, in Figure 5,
% note how the individual HRFs from each trial all start to lump together
% into one big HRF. That's what the HRFs look like in a blocked design.


third_light_stim_time_series = [  zeros(1,12) 1 zeros(1,47) ];
                % A flash of light, with onset-time t=13
                    
all_lights_time_series =  ... % Three dots mean "continued on next line"
     first_light_stim_time_series + second_light_stim_time_series + ...
       third_light_stim_time_series;
                 % Onsets at t=10, t=13 and t=16.
                 
hrf_convolved_with_all_lights_time_series = conv(all_lights_time_series,hrf);

hrf_from_first_light = conv(first_light_stim_time_series,hrf);
hrf_from_second_light = conv(second_light_stim_time_series,hrf);
hrf_from_third_light = conv(third_light_stim_time_series,hrf);

%%%%%%%%%%%%% Let's plot the results of convolving the time-series of
%%%%%%%%%%%%% these three closely spaced flashes of light with the HRF

figure(5);
clf;
subplot(3,1,1);    % This lines up three subplots on this one
stem(all_lights_time_series,'bo-'); 
grid on;
legend('Time-series of light stim');
axis([0 60 0 1.2]);
ylabel('Stimulus present / absent');

subplot(3,1,2);
plot(hrf_convolved_with_all_lights_time_series,'rx-'); % Red crosses, solid line        
grid on;
legend('Stimulus time-series convolved with HRF');
axis([0 60 -2 16]);
ylabel('fMRI signal');

subplot(3,1,3);
hold on;      % This is one way of putting more than one plot on a figure

plot(hrf_from_first_light,'b-');       % Blue solid line
plot(hrf_from_second_light,'m--');     % Magenta dashed line
plot(hrf_from_third_light,'g-');       % Green solid line

hold off;
grid on;
legend('HRF from first flash of light','HRF from second flash of light', ...
                                        'HRF from third flash of light');
axis([0 60 -2 15]);
xlabel('Time (seconds)');
ylabel('fMRI signal');


