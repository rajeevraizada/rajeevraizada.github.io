%%%% Tutorial about the math of convolution.
%%%%
%%%% Written by Rajeev Raizada, Aug.19, 2002.
%%%% 
%%%% This program goes together with hrf_tutorial.m and
%%%% design_matrix_tutorial.m

% The math of convolution:
% So far we have just talked about a stimulus "kicking off" an HRF,
% and the HRFs just adding up on top of each other.
% The actual math of this is just multiplying and adding.
% The multiplying part is: we go along the stimulus-time-series vector,
% element by element, and we multiply each element by the HRF.
% e.g. if the vector starts off: [ 0 0 1 0 ... ]
% then we take multiply: 0*HRF, then 0*HRF, then 1*HRF, then 0*HRF etc.
%
% We then take those multiplied HRFs and add them all together,
% to make an output vector that is the result of the convolution.
%
% The only extra consideration is that each HRF gets "kicked off",
% i.e. multiplied and added, at a different position along the
% stimulus-time-series vector. 
% In our [ 0 0 1 0 ] example above, the 1 is in the third position
% of the stimulus-time-series vector, so we want our 1*HRF to get 
% added onto the same position of our output vector,
% i.e. starting at the third position.
%
% To make things easier, let's try this with a small HRF,
% that we talk more about in design_matrix_tutorial.m

hrf = [ 0  4  2  -1  0 ];

% And let's start with a simple stimulus-time-series vector, corresponding
% to a single stimulus coming on at the third time-point 
% (which will be the third TR, in the case of fMRI).

stim_time_series = [ 0 0 1 0 0 ];

% Now, we want to make an output vector that is the result of
% convolving the stimulus-time-series vector with the HRF.
% So, we go along the stimulus-time-series vector, element by element,
% multiply each element by the HRF, and add the result to
% the corresponding position of our output vector.
%
%        0*[ 0  4  2 -1  0 ]           +
%        
%           0*[ 0  4  2 -1  0 ]        +
%         
%              1*[ 0  4  2 -1  0 ]     +
%         
%                 0*[ 0  4  2 -1  0 ]  +
%
%                    0*[ 0  4  2 -1  0 ] 
%        
% Let's see how this would all add up for making 
% the fifth element in our output:
%
%        0*[ 0  4  2 -1  0 ]           +
%                        .        
%           0*[ 0  4  2 -1  0 ]        +
%                        .
%              1*[ 0  4  2 -1  0 ]     +
%                        .
%                 0*[ 0  4  2 -1  0 ]  +
%                        .
%                    0*[ 0  4  2 -1  0 ] 
%                        .  
% makes the result: 0*0 + 0*-1 + 1*2 +0*4 + 0*0 = 2
%
% In the example above, the 5th element of our output vector
% is equal to:
%
% 1st-element of the stimulus-time-series  *  5th-element of HRF  +
% 2nd-element of the stimulus-time-series  *  4th-element of HRF  +
% 3rd-element of the stimulus-time-series  *  3rd-element of HRF  +
% 4th-element of the stimulus-time-series  *  2nd-element of HRF  +
% 5th-element of the stimulus-time-series  *  1st-element of HRF 
%
% As an equation, this is:
% Output(pos_in_output) =  
%   Sum[ with pos_in_hrf going from 1 to length(hrf) ] of
%     stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
%
% Textbooks will often use a notation like this:
% Output(n) means the n-th element of the output of the result
% of our convolution.
% Typically people write the vector to be convolved as x
% In our case, x is stim_time_series.
% So, x(n) means the n-th element of the onsets-vector, x.
% People often call the vector that this gets convolved with the "filter".
% Another name for it is the "impulse response function",
% which is where the phrase "hemodynamic response function" comes from.
%
% In our case, the filter is the HRF.
% People often call our position in the HRF "k", and the length
% of the HRF "M".
% In that notation:
% Output(n) = Sum[ with k going from 0 to M ]  x(n-k) * hrf(k)
%
% In Matlab, the indices can't be quite as neat as this, because
% a vector doesn't have a zero-th entry. 
% The first entry is element number 1 in the vector,
% even though it corresponds to time=0 in the HRF.
% That's why in the equation
%
%   Output(pos_in_output) =  
%     Sum[ with pos_in_hrf going from 1 to length(hrf) ] of
%       stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
%
% we see that pos_in_hrf goes from 1 to length(hrf), rather than starting
% at zero, and also why there's a "+1" in 
% stim_time_series(pos_in_output - pos_in_hrf + 1)
%
% By the way, note that this means that the result of 
% convolving stim_time_series  with hrf is longer than 
% either stim_time_series or hrf.
% length(output) = length(stim_time_series) + length(hrf) - 1.
% This makes sense when you think of it in terms of a stimulus
% kicking off an HRF that runs to completion.
% Even if the stimulus is right at the very end of a scan and
% if we stop the scan immediately after showing the stimulus,
% it will still have kicked-off an HRF inside the subject's head.
% The result of the convolution is the overall HRF-response that
% the stimuli will evoke, and so if the last stimulus kicks off 
% a fresh HRF, that will continue by one HRF-length past the
% end of the stimulus-time-series.

%%%%%%%%% Using a for-loop to implement the convolution %%%%%%%%%%%%%%
%
% So, now we have the basic equation for the convolution:
%
%   Output(pos_in_output) =  
%     Sum[ with pos_in_hrf going from 1 to length(hrf) ] of
%       stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
%
% and we have to write a computer program that will plug the actual numbers
% into that equation and see what they add up to.
%
% In order to do that, we want to go along the each position in the output,
% one position at a time, and then go along the positions in the HRF,
% carrying out the multiplication:
%    stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
% for each position in the HRF, and then adding up the results of
% all of these multiplications.
%
% In Matlab, and in almost any programming language, the easiest way
% to go along a series of positions in a list, one step at a time,
% is using a for-loop.
% (A for-loop isn't always the most elegant or most efficient method, but
%  it's often the simplest way, so that's how we'll do it here).
%
% Here's how we'd write a for-loop to do the convolution.
%
% Start off with an output vector all zeros, 
% with one row and (length(stim_time_series) + length(hrf) - 1) columns
output = zeros(1,length(stim_time_series) + length(hrf) - 1);           

%%%% Now build two loops.
%%%% The main loop goes along positions in the output vector.
%%%% Nested inside that, we have a smaller loop that goes along
%%%% positions in the HRF.
for pos_in_output = 1:length(output),   
              %%% Go around length(output) times, with the value of
              %%% pos_in_output starting at 1, and increasing by 1 
              %%% each time we go around the loop. 
    
   for pos_in_hrf = 1:length(hrf), 
              %%% This loop is completely inside the pos_in_output loop.
              %%% So, for any given pos_in_output value, we loop
              %%% through all the positions in the HRF, going from 1
              %%% to length(hrf), which is the last element in the HRF.
       
      % Now we want to do summing as we move along the positions in the HRF
      % This involves looking back to the earler positions of 
      % stim_time_series, back to position (pos_in_output - pos_in_hrf + 1).
      % However, if we're at the beginning of the stim_time_series,
      % then these earlier positions don't exist, so they don't
      % play any role in the convolution. 
      % In Matlab, trying to access non-existent parts of the stim_time_series
      % vector would cause an error, so first we check that we're far enough
      % along. Similarly, we can't try to access elements in stim_time_series
      % that happen after the end of that vector.
      
      % Output(pos_in_output) =  
      %   Sum[ with pos_in_hrf going from 1 to length(hrf) ] of
      %     stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
      pos_in_stim_time_series = pos_in_output - pos_in_hrf + 1;
      
      if (pos_in_stim_time_series > 0) & ...  % If it's far enough along and...
         (pos_in_stim_time_series <= length(stim_time_series)),
                                              % it's not too far along.
                                              % <= means less than or equal to
         output(pos_in_output) = output(pos_in_output) + ...
            stim_time_series(pos_in_stim_time_series) * hrf(pos_in_hrf);

      end;  % End of the if-statement
        
   end;     % End of loop along the HRF

end;        % End of loop along the positions in the output vector


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Let's display the output in the Matlab command window, by
% typing it without a semi-colon at the end:

output

% We can check that this is correct by using Matlab's built-in
% convolution function. This should be the same as the output above!

output_from_matlab_conv_function = conv(stim_time_series,hrf)

% You can also express convolution as a matrix multiplication,
% but I'm not going to get into that here.
% If your Matlab has the Signal Processing Toolbox, type
% help convmtx
% for more info.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Ok, that seemed to work.
% Now let's try the same code with a slightly less trivial
% convolution, and let's plot the results.
%
% Instead of just having one stimulus, at time t=3, 
% we'll have several stimuli, and randomly jittered times

stim_time_series = [ 0 0 1 0 1 0 0 0 1 1 0 0 1 0 0 0 1 0 0 0 0 0 ];

output = zeros(1,length(stim_time_series) + length(hrf) - 1);           

%%%%% Below is exactly the same code as above, but with
%%%%% some of the lengthier comments taken out, to save repetition.
for pos_in_output = 1:length(output),   
    
   for pos_in_hrf = 1:length(hrf), 
 
      % Output(pos_in_output) =  
      %   Sum[ with pos_in_hrf going from 1 to length(hrf) ] of
      %     stim_time_series(pos_in_output - pos_in_hrf + 1) * hrf(pos_in_hrf)
      pos_in_stim_time_series = pos_in_output - pos_in_hrf + 1;
      
      if (pos_in_stim_time_series > 0) & ...  % If it's far enough along and...
         (pos_in_stim_time_series <= length(stim_time_series)),
                                              % it's not too far along.
                                              % <= means less than or equal to
         output(pos_in_output) = output(pos_in_output) + ...
            stim_time_series(pos_in_stim_time_series) * hrf(pos_in_hrf);

      end;  % End of the if-statement        
   end;     % End of loop along the HRF
end;        % End of loop along the positions in the output vector

% We can check that this is correct by using Matlab's built-in
% convolution function. This should be the same as the output above!
output_from_matlab_conv_function = conv(stim_time_series,hrf);

%%%%%%%%%%%%% Let's plot the results 

figure(1);
clf;
subplot(3,1,1);    % This lines up three subplots on this figure window
stem(stim_time_series,'bo-'); 
grid on;
legend('Stimulus time-series to be convolved');
axis([0 23 0 1.8]);
ylabel('Stimulus present / absent');

subplot(3,1,2);
plot(output,'rx-'); % Red crosses, solid line 
grid on;
legend('Convolved with HRF using for-loop');
axis([0 23 -2 12]);
ylabel('Predicted fMRI signal');

subplot(3,1,3);
plot(output_from_matlab_conv_function,'k*-'); % Black stars, solid line 
grid on;
legend('Convolved with HRF using built-in Matlab function');
axis([0 23 -2 12]);
ylabel('Predicted fMRI signal');




